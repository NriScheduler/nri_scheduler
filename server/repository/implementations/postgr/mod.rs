mod pool;

use ::std::error::Error;
use chrono::{DateTime, FixedOffset};
use sqlx::{Error as SqlxError, PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use super::super::Store;
use crate::{
	dto::{
		auth::{TouchSearch, UpdateProfileDto},
		company::{ApiUpdateCompanyDto, ReadCompaniesDto},
		event::{ReadEventsDto, UpdateEventDto},
		location::ReadLocationDto,
	},
	repository::models::{
		AppForApproval, City, Company, CompanyInfo, Event, EventForApplying, Location, MasterApp,
		PlayerApp, Profile, Region, ShortEvent, ShortProfile, UserForAuthEmail, UserPair,
	},
	shared::RecordId,
	system_models::{AppError, CoreResult},
};

const DUPLICATE_KEY: &str = "duplicate key";

impl From<SqlxError> for AppError {
	fn from(err: SqlxError) -> Self {
		return AppError::system_error(err);
	}
}

pub(crate) struct PostgresStore {
	pool: PgPool,
}

impl PostgresStore {
	pub(crate) async fn new() -> Result<Self, Box<dyn Error>> {
		let pool = pool::create_db_connection().await?;
		Ok(Self { pool })
	}
}

impl Store for PostgresStore {
	async fn registration(
		&self,
		nickname: &str,
		email: &str,
		hashed_pass: &str,
		timezone_offset: Option<i16>,
	) -> CoreResult<Uuid> {
		let (_, verification_id) = sqlx::query_as::<_, (Uuid, Uuid)>(
			"WITH new_user AS (
				INSERT INTO users (nickname, email, pw_hash, own_tz)
				values ($1, $2, $3, $4)
				returning id as user_id
			),
			new_verification AS (
				INSERT INTO verifications (user_id)
				select user_id from new_user
				returning id as verification_id
			)
			select
				new_user.user_id,
				new_verification.verification_id
			from new_user
			cross join new_verification;",
		)
		.bind(nickname)
		.bind(email)
		.bind(hashed_pass)
		.bind(timezone_offset)
		.fetch_one(&self.pool)
		.await
		.map_err(|err| {
			let err_str = err.to_string();
			if err_str.contains(DUPLICATE_KEY) {
				AppError::scenario_error("Пользователь с данным email уже существует", email.into())
			} else {
				AppError::system_error(err_str)
			}
		})?;

		Ok(verification_id)
	}

	async fn registration_tg(&self, nickname: &str, tg_id: i64) -> CoreResult<Uuid> {
		sqlx::query_scalar::<_, Uuid>(
			"INSERT INTO users (nickname, tg_id) values ($1, $2) returning id;",
		)
		.bind(nickname)
		.bind(tg_id)
		.fetch_one(&self.pool)
		.await
		.map_err(|err| {
			let err_str = err.to_string();
			if err_str.contains(DUPLICATE_KEY) {
				AppError::scenario_error(
					"Пользователь с данным аккаунтом telegram уже существует",
					None::<&str>,
				)
			} else {
				AppError::system_error(err_str)
			}
		})
	}

	async fn get_user_for_signing_in_email(
		&self,
		email: &str,
	) -> CoreResult<Option<UserForAuthEmail>> {
		let may_be_user = sqlx::query_as::<_, UserForAuthEmail>(
			"SELECT id, pw_hash, email_verified as verified FROM users WHERE email = $1;",
		)
		.bind(email)
		.fetch_optional(&self.pool)
		.await?;

		Ok(may_be_user)
	}

	async fn get_user_for_signing_in_tg(&self, tg_id: i64) -> CoreResult<Option<Uuid>> {
		let may_be_user = sqlx::query_scalar::<_, Uuid>("SELECT id FROM users WHERE tg_id = $1;")
			.bind(tg_id)
			.fetch_optional(&self.pool)
			.await?;

		Ok(may_be_user)
	}

	async fn read_profile(&self, user_id: Uuid) -> CoreResult<Option<Profile>> {
		let may_be_profile = sqlx::query_as::<_, Profile>(
			"select
				sq.id
				, sq.nickname
				, sq.email
				, sq.email_verified
				, sq.tg_id
				, sq.about_me
				, sq.city
				, sq.region
				, sq.avatar_link
				, tz.offset as timezone_offset
				, sq.tz_variant
				, (sq.tz_variant is not null and sq.tz_variant = 'device') as get_tz_from_device
			from (
				select
					u.id
					, u.nickname
					, u.email
					, u.email_verified
					, u.tg_id
					, u.about_me
					, u.city
					, r.name as region
					, CASE
						WHEN avatar_link IS NOT NULL THEN ('/avatar/' || id)
						ELSE NULL
					END AS avatar_link
					, case
						when u.tz_variant = 'own' and u.own_tz is not null then u.own_tz
						when u.tz_variant = 'city' then coalesce(c.own_timezone, r.timezone)
						else null
					end as timezone_offset
					, u.tz_variant
				FROM users u
				left join cities c
					on c.name = u.city
				left join regions r
					on r.name = c.region
				WHERE u.id = $1
			) sq
			left join timezone_offsets tz
				on tz.name = sq.timezone_offset;",
		)
		.bind(user_id)
		.fetch_optional(&self.pool)
		.await?;

		Ok(may_be_profile)
	}

	async fn read_another_profile(&self, user_id: Uuid) -> CoreResult<Option<ShortProfile>> {
		sqlx::query_as::<_, ShortProfile>(
			"select
				u.id
				, u.nickname
				, u.about_me as about
				, u.city
				, r.name as region
				, CASE
					WHEN avatar_link IS NOT NULL THEN ('/avatar/' || id)
					ELSE NULL
				END AS avatar_link
				, (u.email_verified or u.tg_id is not null) as verified
			FROM users u
			left join cities c
				on c.name = u.city
			left join regions r
				on r.name = c.region
			WHERE u.id = $1;",
		)
		.bind(user_id)
		.fetch_optional(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn read_touches_history(
		&self,
		user_id: Uuid,
		search: TouchSearch,
	) -> CoreResult<Vec<UserPair>> {
		if search.is_empty() {
			return Ok(Vec::default());
		}

		let mut qb: QueryBuilder<'_, Postgres> = QueryBuilder::new("");

		if search.masters {
			qb.push(
				"select
	distinct u.id,
	u.nickname
from applications a
inner join events e
	on a.event = e.id
inner join companies c
	on e.company = c.id
inner join users u
	on c.master = u.id
where a.player = ",
			);
			qb.push_bind(user_id);
		}

		if search.masters && (search.players || search.co_players) {
			qb.push("\nUNION\n");
		}

		if search.players {
			qb.push(
				"select
	distinct u.id,
	u.nickname
from companies c
inner join events e
	on e.company = c.id
inner join applications a
	on a.event = e.id
inner join users u
	on u.id = a.player
where c.master = ",
			);
			qb.push_bind(user_id);
		}

		if (search.masters || search.players) && search.co_players {
			qb.push("\nUNION\n");
		}

		if search.co_players {
			qb.push(
				"select
	distinct u.id,
	u.nickname
from applications a1
inner join applications a2
	on a1.event = a2.event
inner join users u
	on a2.player = u.id
where a1.player = ",
			);
			qb.push_bind(user_id);
			qb.push(" and a2.player <> ");
			qb.push_bind(user_id);
		}

		qb.push(" order by nickname asc;");

		qb.build_query_as::<UserPair>()
			.fetch_all(&self.pool)
			.await
			.map_err(AppError::from)
	}

	async fn update_profile(&self, user_id: Uuid, profile: UpdateProfileDto) -> CoreResult {
		sqlx::query("update users set nickname = $1, about_me = $2, city = $3, own_tz = $4, tz_variant = $5 where id = $6;")
			.bind(profile.nickname)
			.bind(profile.about_me)
			.bind(profile.city)
			.bind(profile.own_tz)
			.bind(profile.tz_variant)
			.bind(user_id)
			.execute(&self.pool)
			.await?;

		Ok(())
	}

	async fn get_avatar_link(&self, user_id: Uuid) -> CoreResult<Option<String>> {
		let maybe_link =
			sqlx::query_scalar::<_, String>("select avatar_link from users where id = $1;")
				.bind(user_id)
				.fetch_optional(&self.pool)
				.await?;

		Ok(maybe_link)
	}

	async fn set_avatar(&self, user_id: Uuid, url: &str) -> CoreResult {
		sqlx::query("update users set avatar_link = $1 where id = $2;")
			.bind(url)
			.bind(user_id)
			.execute(&self.pool)
			.await?;

		Ok(())
	}

	async fn verify_email(&self, verification_id: Uuid) -> CoreResult<Option<(bool, bool)>> {
		sqlx::query_as::<_, (bool, bool)>(
			"WITH existing_verification AS (
				DELETE FROM verifications
				WHERE id = $1
				RETURNING id, user_id
			),
			verification_status AS (
				SELECT
					v.user_id,
					(EXTRACT(HOUR FROM (CURRENT_TIMESTAMP - restore_timestamp_from_uuid_v6(v.id))) >= 1) AS expired
				FROM verifications v
				INNER JOIN existing_verification ev ON v.id = ev.id
			),
			update_result AS (
				UPDATE users
				SET email_verified = true
				FROM verification_status vs
				WHERE
					users.id = vs.user_id
					AND vs.expired = false
					AND users.email_verified = false
				RETURNING users.id, true AS was_updated
			)
			SELECT
				vs.expired,
				COALESCE(ur.was_updated, false) AS was_updated
			FROM verification_status vs
			LEFT JOIN update_result ur ON ur.id = vs.user_id;",
		)
		.bind(verification_id)
		.fetch_optional(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn send_email_verification(&self, user_id: Uuid) -> CoreResult<(Uuid, String)> {
		sqlx::query_as::<_, (Uuid, String)>(
			"WITH delete_old AS (
				DELETE FROM verifications
				WHERE user_id = $1
			),
			existing_user AS (
				select id, email from users where id = $1
			),
			new_verification AS (
				INSERT INTO verifications (user_id) values ($1) returning id
			)
			select
				new_verification.id,
				existing_user.email
			from new_verification
			cross join existing_user;",
		)
		.bind(user_id)
		.fetch_one(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn get_locations_list(&self, query_args: ReadLocationDto) -> CoreResult<Vec<Location>> {
		let mut qb: QueryBuilder<'_, Postgres> = QueryBuilder::new("SELECT l.*, r.name as region");

		let query_name = query_args.name.as_deref().unwrap_or_default();
		let query_region = query_args.region.as_deref().unwrap_or_default();
		let query_city = query_args.city.as_deref().unwrap_or_default();

		if !query_name.is_empty() {
			qb.push(", CASE WHEN LOWER(l.name) LIKE LOWER(");
			qb.push_bind(query_name);
			qb.push(") || '%' THEN 1 ");

			qb.push("WHEN LOWER(l.name) LIKE '%' || LOWER(");
			qb.push_bind(query_name);
			qb.push(") || '%' THEN 2 ");
			qb.push("END AS rank");
		}

		qb.push(
			" FROM locations l
LEFT JOIN cities c ON c.name = l.city
LEFT JOIN regions r ON r.name = c.region",
		);

		if !query_name.is_empty() || !query_region.is_empty() || !query_city.is_empty() {
			qb.push(" WHERE ");

			if !query_name.is_empty() {
				qb.push("LOWER(l.name) LIKE '%' || LOWER(");
				qb.push_bind(query_name);
				qb.push(") || '%'");
			}

			if !query_region.is_empty() {
				if !query_name.is_empty() {
					qb.push(" AND ");
				}

				qb.push("r.name = ");
				qb.push_bind(query_region);
			}

			if !query_city.is_empty() {
				if !query_name.is_empty() || !query_region.is_empty() {
					qb.push(" AND ");
				}

				qb.push("c.name = ");
				qb.push_bind(query_city);
			}
		}

		qb.push(" order by");
		if !query_name.is_empty() {
			qb.push(" rank,");
		}
		qb.push(" l.name asc");

		let locations = qb
			.build_query_as::<Location>()
			.fetch_all(&self.pool)
			.await?;

		Ok(locations)
	}

	async fn get_location_by_id(&self, location_id: Uuid) -> CoreResult<Option<Location>> {
		let may_be_location = sqlx::query_as::<_, Location>(
			"SELECT
	l.*
	, r.name as region
FROM locations l
LEFT JOIN cities c ON c.name = l.city
LEFT JOIN regions r ON r.name = c.region
WHERE id = $1;",
		)
		.bind(location_id)
		.fetch_optional(&self.pool)
		.await?;

		Ok(may_be_location)
	}

	async fn add_location(
		&self,
		name: &str,
		address: &Option<String>,
		descr: &Option<String>,
		city: &Option<String>,
		map_link: &Option<String>,
	) -> CoreResult<RecordId> {
		let query_result = sqlx::query_scalar::<_, RecordId>(
			"INSERT INTO locations (name, address, description, city, map_link) values ($1, $2, $3, $4, $5) returning id;",
		)
		.bind(name)
		.bind(address)
		.bind(descr)
		.bind(city)
		.bind(map_link)
		.fetch_one(&self.pool)
		.await;

		let new_loc_id = query_result.map_err(|err| {
			let err_str = err.to_string();
			if err_str.contains(DUPLICATE_KEY) {
				AppError::scenario_error("Локация с данным названием уже существует", name.into())
			} else {
				AppError::system_error(err_str)
			}
		})?;

		Ok(new_loc_id)
	}

	async fn get_company_by_id(
		&self,
		company_id: Uuid,
		user_id: Option<Uuid>,
	) -> CoreResult<Option<CompanyInfo>> {
		let may_be_company = sqlx::query_as::<_, CompanyInfo>(
			"SELECT
				c.id, c.master, c.name, c.system, c.description
				, CASE
					WHEN cover_link IS NOT NULL THEN ('/cover/' || c.id)
					ELSE NULL
				END AS cover_link
				, u.nickname AS master_name
				, ($2 is not null and u.id = $2) AS you_are_master
				, c.event_style
			FROM companies c
			inner join users u
				on c.master = u.id
			where c.id = $1;",
		)
		.bind(company_id)
		.bind(user_id)
		.fetch_optional(&self.pool)
		.await?;

		Ok(may_be_company)
	}

	async fn get_company_cover(&self, company_id: Uuid) -> CoreResult<Option<String>> {
		let maybe_link =
			sqlx::query_scalar::<_, String>("select cover_link from companies where id = $1;")
				.bind(company_id)
				.fetch_optional(&self.pool)
				.await?;

		Ok(maybe_link)
	}

	async fn get_my_companies(
		&self,
		query_args: ReadCompaniesDto,
		master: Uuid,
	) -> CoreResult<Vec<Company>> {
		let mut qb: QueryBuilder<'_, Postgres> = QueryBuilder::new(
			r#"SELECT "id", "master", "name", "system", "description"
				, CASE
					WHEN "cover_link" IS NOT NULL THEN ('/cover/' || "id")
					ELSE NULL
				END AS "cover_link""#,
		);

		let query_name = query_args.name.unwrap_or_default();

		if !query_name.is_empty() {
			qb.push(", CASE WHEN LOWER(name) LIKE LOWER(");
			qb.push_bind(&query_name);
			qb.push(") || '%' THEN 1 ");

			qb.push("WHEN LOWER(name) LIKE '%' || LOWER(");
			qb.push_bind(&query_name);
			qb.push(") || '%' THEN 2 ");
			qb.push("END AS rank");
		}

		qb.push(" FROM companies WHERE master = ");
		qb.push_bind(master);

		if !query_name.is_empty() {
			qb.push(" AND LOWER(name) LIKE '%' || LOWER(");
			qb.push_bind(&query_name);
			qb.push(") || '%'");
		}

		qb.push(" order by");
		if !query_name.is_empty() {
			qb.push(" rank,");
		}
		qb.push(" name asc");

		let companies = qb.build_query_as::<Company>().fetch_all(&self.pool).await?;

		Ok(companies)
	}

	async fn add_company(
		&self,
		master: Uuid,
		name: &str,
		system: &str,
		descr: &Option<String>,
		cover_link: &Option<String>,
		event_style: &Option<String>,
	) -> CoreResult<RecordId> {
		let new_comp_id = sqlx::query_scalar::<_, RecordId>(
			"INSERT INTO companies
			(master, name, system, description, cover_link, event_style)
			values ($1, $2, $3, $4, $5, $6)
			returning id;",
		)
		.bind(master)
		.bind(name)
		.bind(system)
		.bind(descr)
		.bind(cover_link)
		.bind(event_style)
		.fetch_one(&self.pool)
		.await?;

		Ok(new_comp_id)
	}

	async fn update_company(
		&self,
		company_id: Uuid,
		master: Uuid,
		data: ApiUpdateCompanyDto,
	) -> CoreResult<bool> {
		if data.is_empty() {
			return Ok(true);
		}

		let is_name_passed = data.name.is_some();
		let is_system_passed = data.system.is_some();
		let is_description_passed = data.description.is_some();
		let is_event_style_passed = data.event_style.is_some();

		let mut qb: QueryBuilder<'_, Postgres> = QueryBuilder::new("update companies set");

		if is_name_passed {
			qb.push(" name = ");
			qb.push_bind(data.name.unwrap());
		}

		if is_system_passed {
			if is_name_passed {
				qb.push(",");
			}
			qb.push(" system = ");
			qb.push_bind(data.system.unwrap());
		}

		if is_description_passed {
			if is_name_passed || is_system_passed {
				qb.push(",");
			}
			qb.push(" description = ");
			qb.push_bind(data.description.unwrap());
		}

		if is_event_style_passed {
			if is_name_passed || is_system_passed || is_description_passed {
				qb.push(",");
			}
			qb.push(" event_style = ");
			qb.push_bind(data.event_style.unwrap());
		}

		qb.push(" where id = ");
		qb.push_bind(company_id);
		qb.push(" and master = ");
		qb.push_bind(master);
		qb.push(" returning true;");

		let was_updated = qb
			.build_query_scalar::<bool>()
			.fetch_optional(&self.pool)
			.await?
			.unwrap_or_default();

		Ok(was_updated)
	}

	async fn set_cover(
		&self,
		master_id: Uuid,
		company_id: Uuid,
		cover_link: &str,
	) -> CoreResult<bool> {
		let was_updated = sqlx::query_scalar::<_, bool>(
			"update companies set cover_link = $1 where id = $2 and master = $3 returning true;",
		)
		.bind(cover_link)
		.bind(company_id)
		.bind(master_id)
		.fetch_optional(&self.pool)
		.await?
		.unwrap_or_default();

		Ok(was_updated)
	}

	async fn read_events_list(
		&self,
		query_args: ReadEventsDto,
		player_id: Option<Uuid>,
	) -> CoreResult<Vec<ShortEvent>> {
		let mut qb: QueryBuilder<'_, Postgres> = QueryBuilder::new(
			"SELECT
					e.id
					, c.name AS company
					, e.date
					, e.plan_duration
					, c.event_style as style
				FROM events e
				INNER JOIN companies c
					ON c.id = e.company",
		);

		if !query_args.company.is_empty() {
			qb.push(" AND e.company = ANY(");
			qb.push_bind(query_args.company);
			qb.push(')');
		}

		if query_args.location.is_some() || query_args.region.is_some() || query_args.city.is_some() {
			qb.push(" INNER JOIN locations l ON l.id = e.location");
		}

		if let Some(location_id) = query_args.location {
			qb.push(" AND l.id = ");
			qb.push_bind(location_id);
		}

		if query_args.region.is_some() || query_args.city.is_some() {
			qb.push(" INNER JOIN cities ci ON ci.name = l.city");
		}

		if let Some(city) = query_args.city {
			qb.push(" AND ci.name = ");
			qb.push_bind(city);
		}

		if let Some(region) = query_args.region {
			qb.push(" INNER JOIN regions r ON r.name = ci.region AND r.name = ");
			qb.push_bind(region);
		}

		qb.push(" INNER JOIN users m ON m.id = c.master");

		if let Some(master_id) = query_args.master {
			qb.push(" AND m.id = ");
			qb.push_bind(master_id);
		} else if let Some(imamaster) = query_args.imamaster
			&& let Some(my_id) = player_id
		{
			match imamaster {
				true => qb.push(" AND m.id = "),
				false => qb.push(" AND m.id <> "),
			};
			qb.push_bind(my_id);
		}

		qb.push(" LEFT JOIN applications y ON y.player = ");
		qb.push_bind(player_id);

		qb.push(
			" and y.event = e.id
				LEFT JOIN applications ap
					ON ap.event = e.id
				LEFT JOIN users u
					ON u.id = ap.player
				WHERE e.date >= ",
		);
		qb.push_bind(query_args.date_from);

		qb.push(" AND e.date <= ");
		qb.push_bind(query_args.date_to);

		if let Some(applied) = query_args.applied {
			match applied {
				true => qb.push(" AND y.id is not null"),
				false => qb.push(" AND y.id is null"),
			};
		}

		if let Some(not_rejected) = query_args.not_rejected {
			match not_rejected {
				true => qb.push(" AND (y.approval is null OR y.approval = true)"),
				false => qb.push(" AND y.approval = false"),
			};
		}

		qb.push(';');

		qb.build_query_as::<ShortEvent>()
			.fetch_all(&self.pool)
			.await
			.map_err(AppError::from)
	}

	async fn read_event(
		&self,
		event_id: Uuid,
		player_id: Option<Uuid>,
	) -> CoreResult<Option<Event>> {
		let event = sqlx::query_as::<_, Event>(
			"SELECT
				e.id
				, c.name AS company
				, c.id AS company_id
				, m.nickname AS master
				, m.id AS master_id
				, l.name AS location
				, l.id AS location_id
				, l.map_link AS location_map_link
				, e.date
				, e.cancelled
				, COALESCE(jsonb_agg(jsonb_build_array(u.id, u.nickname)) FILTER (WHERE u.id is not null), '[]') AS players
				, e.max_slots
				, e.plan_duration
				, bool_or(y.id is not null) AS you_applied
				, ($2 is not null and c.master = $2) as you_are_master
				, y.approval AS your_approval
			FROM events e
			INNER JOIN companies c
				ON c.id = e.company
			INNER JOIN locations l
				ON l.id = e.location
			INNER JOIN users m
				ON m.id = c.master
			LEFT JOIN applications y
				ON y.player = $2 and y.event = e.id
			LEFT JOIN applications ap
				ON ap.event = e.id
			LEFT JOIN users u
				ON u.id = ap.player
			WHERE e.id = $1
			GROUP BY e.id, c.name, c.id, m.nickname, m.id, l.name, l.id, e.date, e.cancelled, y.approval;",
		)
		.bind(event_id)
		.bind(player_id)
		.fetch_optional(&self.pool)
		.await?;

		Ok(event)
	}

	async fn get_event_for_applying(
		&self,
		event_id: Uuid,
		player_id: Uuid,
	) -> CoreResult<Option<EventForApplying>> {
		let event = sqlx::query_as::<_, EventForApplying>(
			"WITH approved_slots AS (
				select count(*) as count
				from applications
				where event = $1
				and approval is true
			)
			select
				e.id
				, (c.master = $2) as you_are_master
				, c.master as master_id
				, c.name as company_name
				, e.date as event_date
				, bool_or(a.id is not null) AS already_applied
				, (e.max_slots is null or approved_slots.count < e.max_slots) as can_auto_approve
				, e.cancelled
			from events e
			inner join companies c
				on c.id = e.company
			left join applications a
				on a.event = e.id
				and a.player = $2
			inner join approved_slots on true
			where e.id = $1
			group by e.id, c.master, c.name, e.date, approved_slots.count;",
		)
		.bind(event_id)
		.bind(player_id)
		.fetch_optional(&self.pool)
		.await?;

		Ok(event)
	}

	async fn apply_event(
		&self,
		event_id: Uuid,
		player_id: Uuid,
		can_auto_approve: bool,
	) -> CoreResult<RecordId> {
		let approval = if can_auto_approve { Some(true) } else { None };

		let new_app_id = sqlx::query_scalar::<_, RecordId>(
			"INSERT INTO applications (event, player, approval) values ($1, $2, $3) returning id;",
		)
		.bind(event_id)
		.bind(player_id)
		.bind(approval)
		.fetch_one(&self.pool)
		.await?;

		Ok(new_app_id)
	}

	async fn cancel_event(&self, event_id: Uuid) -> CoreResult {
		sqlx::query("UPDATE events SET cancelled = true WHERE id = $1;")
			.bind(event_id)
			.execute(&self.pool)
			.await?;

		Ok(())
	}

	async fn reopen_event(&self, event_id: Uuid) -> CoreResult {
		sqlx::query("UPDATE events SET cancelled = false WHERE id = $1;")
			.bind(event_id)
			.execute(&self.pool)
			.await?;

		Ok(())
	}

	async fn add_event(
		&self,
		company: Uuid,
		location: &Option<Uuid>,
		date: DateTime<FixedOffset>,
		max_slots: Option<i16>,
		plan_duration: Option<i16>,
	) -> CoreResult<RecordId> {
		let new_evt_id = sqlx::query_scalar::<_, RecordId>(
			"INSERT INTO events (company, location, date, max_slots, plan_duration) values ($1, $2, $3, $4, $5) returning id;",
		)
		.bind(company)
		.bind(location)
		.bind(date)
		.bind(max_slots)
		.bind(plan_duration)
		.fetch_one(&self.pool)
		.await?;

		Ok(new_evt_id)
	}

	async fn update_event(
		&self,
		event_id: Uuid,
		master: Uuid,
		data: UpdateEventDto,
	) -> CoreResult<bool> {
		let was_updated = sqlx::query_scalar::<_, bool>(
			"update events
			SET
				location = $1,
				date = $2,
				max_slots = $3,
				plan_duration = $4
			where id in (
				select e.id
				from events e
				inner join companies c
					on e.company = c.id
				where e.id = $5
				and c.master = $6
			)
			returning true;",
		)
		.bind(data.location)
		.bind(data.date)
		.bind(data.max_slots)
		.bind(data.plan_duration)
		.bind(event_id)
		.bind(master)
		.fetch_optional(&self.pool)
		.await?
		.unwrap_or_default();

		Ok(was_updated)
	}

	async fn read_player_apps_list(&self, player_id: Uuid) -> CoreResult<Vec<PlayerApp>> {
		sqlx::query_as::<_, PlayerApp>(
			"select
	a.id
	, e.id as event_id
	, e.date as event_date
	, e.cancelled as event_cancelled
	, c.id as company_id
	, c.name as company_name
	, l.id as location_id
	, l.name as location_name
	, m.id as master_id
	, m.nickname as master_name
	, a.approval
from applications a
inner join events e
	on e.id = a.event
inner join companies c
	on c.id = e.company
inner join locations l
	on l.id = e.location
inner join users m
	on m.id = c.master
where a.player = $1
and e.date > CURRENT_TIMESTAMP
order by e.date asc;",
		)
		.bind(player_id)
		.fetch_all(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn read_player_app(&self, player_id: Uuid, app_id: Uuid) -> CoreResult<Option<PlayerApp>> {
		sqlx::query_as::<_, PlayerApp>(
			"select
	a.id
	, e.id as event_id
	, e.date as event_date
	, e.cancelled as event_cancelled
	, c.id as company_id
	, c.name as company_name
	, l.id as location_id
	, l.name as location_name
	, m.id as master_id
	, m.nickname as master_name
	, a.approval
from applications a
inner join events e
	on e.id = a.event
inner join companies c
	on c.id = e.company
inner join locations l
	on l.id = e.location
inner join users m
	on m.id = c.master
where a.id = $1
and a.player = $2;",
		)
		.bind(app_id)
		.bind(player_id)
		.fetch_optional(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn read_player_app_by_event(
		&self,
		player_id: Uuid,
		event_id: Uuid,
	) -> CoreResult<Option<PlayerApp>> {
		sqlx::query_as::<_, PlayerApp>(
			"select
	a.id
	, e.id as event_id
	, e.date as event_date
	, e.cancelled as event_cancelled
	, c.id as company_id
	, c.name as company_name
	, l.id as location_id
	, l.name as location_name
	, m.id as master_id
	, m.nickname as master_name
	, a.approval
from applications a
inner join events e
	on e.id = a.event
inner join companies c
	on c.id = e.company
inner join locations l
	on l.id = e.location
inner join users m
	on m.id = c.master
where e.id = $1
and a.player = $2;",
		)
		.bind(event_id)
		.bind(player_id)
		.fetch_optional(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn read_player_app_company_closest(
		&self,
		player_id: Uuid,
		company_id: Uuid,
	) -> CoreResult<Option<PlayerApp>> {
		sqlx::query_as::<_, PlayerApp>(
			"WITH nearest_event AS (
	SELECT e.id
	FROM events e
	WHERE e.company = $1
	AND e.date > CURRENT_TIMESTAMP
	ORDER BY e.date ASC
	LIMIT 1
)
SELECT
	a.id,
	e.id as event_id,
	e.date as event_date,
	e.cancelled as event_cancelled,
	c.id as company_id,
	c.name as company_name,
	l.id as location_id,
	l.name as location_name,
	m.id as master_id,
	m.nickname as master_name,
	a.approval
FROM applications a
INNER JOIN events e
	ON e.id = a.event
INNER JOIN companies c
	ON c.id = e.company
INNER JOIN locations l
	ON l.id = e.location
INNER JOIN users m
	ON m.id = c.master
WHERE e.id = (SELECT id FROM nearest_event)
AND a.player = $2;",
		)
		.bind(company_id)
		.bind(player_id)
		.fetch_optional(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn read_master_apps_list(&self, master_id: Uuid) -> CoreResult<Vec<MasterApp>> {
		sqlx::query_as::<_, MasterApp>(
			"select
	a.id
	, e.id as event_id
	, e.date as event_date
	, e.cancelled as event_cancelled
	, c.id as company_id
	, c.name as company_name
	, l.id as location_id
	, l.name as location_name
	, p.id as player_id
	, p.nickname as player_name
	, a.approval
from applications a
inner join events e
	on e.id = a.event
inner join companies c
	on c.id = e.company
inner join locations l
	on l.id = e.location
inner join users m
	on m.id = c.master
inner join users p
	on p.id = a.player
where m.id = $1
and e.date > CURRENT_TIMESTAMP
order by e.date, a.id asc;",
		)
		.bind(master_id)
		.fetch_all(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn read_master_apps_list_by_event(
		&self,
		master_id: Uuid,
		event_id: Uuid,
	) -> CoreResult<Vec<MasterApp>> {
		sqlx::query_as::<_, MasterApp>(
			"select
	a.id
	, e.id as event_id
	, e.date as event_date
	, e.cancelled as event_cancelled
	, c.id as company_id
	, c.name as company_name
	, l.id as location_id
	, l.name as location_name
	, p.id as player_id
	, p.nickname as player_name
	, a.approval
from applications a
inner join events e
	on e.id = a.event
inner join companies c
	on c.id = e.company
inner join locations l
	on l.id = e.location
inner join users m
	on m.id = c.master
inner join users p
	on p.id = a.player
where m.id = $1
and e.id = $2
order by a.id asc;",
		)
		.bind(master_id)
		.bind(event_id)
		.fetch_all(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn read_master_apps_list_company_closest(
		&self,
		master_id: Uuid,
		company_id: Uuid,
	) -> CoreResult<Vec<MasterApp>> {
		sqlx::query_as::<_, MasterApp>(
			"WITH nearest_event AS (
	SELECT e.id
	FROM events e
	WHERE e.company = $2
	AND e.date > CURRENT_TIMESTAMP
	ORDER BY e.date ASC
	LIMIT 1
)
SELECT
	a.id,
	e.id as event_id,
	e.date as event_date,
	e.cancelled as event_cancelled,
	c.id as company_id,
	c.name as company_name,
	l.id as location_id,
	l.name as location_name,
	p.id as player_id,
	p.nickname as player_name,
	a.approval
FROM applications a
INNER JOIN events e
	ON e.id = a.event
INNER JOIN companies c
	ON c.id = e.company
INNER JOIN locations l
	ON l.id = e.location
INNER JOIN users m
	ON m.id = c.master
INNER JOIN users p
	ON p.id = a.player
WHERE m.id = $1
AND e.id = (SELECT id FROM nearest_event)
ORDER BY a.id asc;",
		)
		.bind(master_id)
		.bind(company_id)
		.fetch_all(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn read_master_app(&self, master_id: Uuid, app_id: Uuid) -> CoreResult<Option<MasterApp>> {
		sqlx::query_as::<_, MasterApp>(
			"select
	a.id,
	e.id as event_id,
	e.date as event_date,
	e.cancelled as event_cancelled,
	c.id as company_id,
	c.name as company_name,
	l.id as location_id,
	l.name as location_name,
	p.id as player_id,
	p.nickname as player_name,
	a.approval
from applications a
inner join events e
	on e.id = a.event
inner join companies c
	on c.id = e.company
inner join locations l
	on l.id = e.location
inner join users m
	on m.id = c.master
inner join users p
	on p.id = a.player
where a.id = $1
and m.id = $2;",
		)
		.bind(app_id)
		.bind(master_id)
		.fetch_optional(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn read_app_for_approval(
		&self,
		master_id: Uuid,
		app_id: Uuid,
	) -> CoreResult<Option<AppForApproval>> {
		sqlx::query_as::<_, AppForApproval>(
			"select
	e.date as event_date,
	e.cancelled as event_cancelled,
	a.approval
from applications a
inner join events e
	on e.id = a.event
inner join companies c
	on c.id = e.company
inner join users m
	on m.id = c.master
where a.id = $1
and m.id = $2;",
		)
		.bind(app_id)
		.bind(master_id)
		.fetch_optional(&self.pool)
		.await
		.map_err(AppError::from)
	}

	async fn approve_app(&self, app_id: Uuid) -> CoreResult {
		sqlx::query("update applications set approval = true where id = $1;")
			.bind(app_id)
			.execute(&self.pool)
			.await?;

		Ok(())
	}

	async fn reject_app(&self, app_id: Uuid) -> CoreResult {
		sqlx::query("update applications set approval = false where id = $1;")
			.bind(app_id)
			.execute(&self.pool)
			.await?;

		Ok(())
	}

	async fn read_regions_list(&self) -> CoreResult<Vec<Region>> {
		sqlx::query_as::<_, Region>("select name, timezone from regions order by name asc;")
			.fetch_all(&self.pool)
			.await
			.map_err(AppError::from)
	}

	async fn read_cities_list(&self, region: Option<String>) -> CoreResult<Vec<City>> {
		let mut qb: QueryBuilder<'_, Postgres> =
			QueryBuilder::new("select name, region, own_timezone from cities");

		if let Some(region) = region {
			qb.push(" where region = ");
			qb.push_bind(region);
		}

		qb.push(" order by name asc;");

		qb.build_query_as::<City>()
			.fetch_all(&self.pool)
			.await
			.map_err(AppError::from)
	}

	async fn add_region(&self, region: Region) -> CoreResult {
		sqlx::query("INSERT INTO regions (name, timezone) values ($1, $2);")
			.bind(region.name)
			.bind(region.timezone)
			.execute(&self.pool)
			.await?;

		Ok(())
	}

	async fn add_city(&self, city: City) -> CoreResult {
		sqlx::query("INSERT INTO cities (name, region, own_timezone) values ($1, $2, $3);")
			.bind(city.name)
			.bind(city.region)
			.bind(city.own_timezone)
			.execute(&self.pool)
			.await?;

		Ok(())
	}

	async fn close(&self) {
		self.pool.close().await;
	}
}
