mod pool;

use ::std::error::Error;
use chrono::{DateTime, FixedOffset};
use sqlx::{Error as SqlxError, PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use super::super::Store;
use crate::{
	dto::{
		auth::UpdateProfileDto,
		company::{ApiUpdateCompanyDto, ReadCompaniesDto},
		event::{ReadEventsDto, UpdateEventDto},
		location::ReadLocationDto,
	},
	repository::models::{
		City, Company, CompanyInfo, Event, EventForApplying, Location, Profile, Region, SelfInfo,
		UserForAuth,
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
	) -> CoreResult {
		let query_result = sqlx::query(
			"INSERT INTO users (nickname, email, pw_hash, own_tz) values ($1, $2, $3, $4);",
		)
		.bind(nickname)
		.bind(email)
		.bind(hashed_pass)
		.bind(timezone_offset)
		.execute(&self.pool)
		.await;

		query_result.map_err(|err| {
			let err_str = err.to_string();
			if err_str.contains(DUPLICATE_KEY) {
				AppError::scenario_error("Пользователь с данным email уже существует", email.into())
			} else {
				AppError::system_error(err_str)
			}
		})?;

		Ok(())
	}

	async fn get_user_for_signing_in(&self, email: &str) -> CoreResult<Option<UserForAuth>> {
		let may_be_user =
			sqlx::query_as::<_, UserForAuth>("SELECT id, pw_hash FROM users WHERE email = $1;")
				.bind(email)
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
				, sq.about_me
				, sq.city
				, sq.avatar_link
				, EXTRACT(HOUR FROM tz.utc_offset)::smallint as timezone_offset
				, sq.tz_variant
				, (sq.tz_variant is not null and sq.tz_variant = 'device'sq.tz_variant = 'device') as get_tz_from_device
			from (
				select
					u.id
					, u.nickname
					, u.email
					, u.about_me
					, u.city
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
			left join pg_timezone_names tz
				on tz.name = sq.timezone_offset;",
		)
		.bind(user_id)
		.fetch_optional(&self.pool)
		.await?;

		Ok(may_be_profile)
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

	async fn who_i_am(&self, user_id: Uuid) -> CoreResult<Option<SelfInfo>> {
		let may_be_self_info = sqlx::query_as::<_, SelfInfo>(
			"select
				sq.id,
				EXTRACT(HOUR FROM tz.utc_offset)::smallint as timezone_offset,
				(sq.tz_variant = 'device') as get_tz_from_device
			from (
				select
					u.id,
					case
						when u.tz_variant = 'own' and u.own_tz is not null then u.own_tz
						when u.tz_variant = 'city' then coalesce(c.own_timezone, r.timezone)
						else null
					end as timezone_offset,
					u.tz_variant
				FROM users u
				left join cities c
					on c.name = u.city
				left join regions r
					on r.name = c.region
				WHERE u.id = $1
			) sq
			left join pg_timezone_names tz
				on tz.name = sq.timezone_offset;",
		)
		.bind(user_id)
		.fetch_optional(&self.pool)
		.await?;

		Ok(may_be_self_info)
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

	async fn get_locations_list(&self, query_args: ReadLocationDto) -> CoreResult<Vec<Location>> {
		let mut qb: QueryBuilder<'_, Postgres> = QueryBuilder::new("SELECT *");

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

		qb.push(" FROM locations");
		if !query_name.is_empty() {
			qb.push(" WHERE LOWER(name) LIKE '%' || LOWER(");
			qb.push_bind(&query_name);
			qb.push(") || '%'");
		}

		qb.push(" order by");
		if !query_name.is_empty() {
			qb.push(" rank,");
		}
		qb.push(" name asc");

		let locations = qb
			.build_query_as::<Location>()
			.fetch_all(&self.pool)
			.await?;

		Ok(locations)
	}

	async fn get_location_by_id(&self, location_id: Uuid) -> CoreResult<Option<Location>> {
		let may_be_location = sqlx::query_as::<_, Location>("SELECT * FROM locations WHERE id = $1;")
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
	) -> CoreResult<RecordId> {
		let query_result = sqlx::query_scalar::<_, RecordId>(
			"INSERT INTO locations (name, address, description) values ($1, $2, $3) returning id;",
		)
		.bind(name)
		.bind(address)
		.bind(descr)
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
	) -> CoreResult<RecordId> {
		let new_comp_id = sqlx::query_scalar::<_, RecordId>(
			"INSERT INTO companies (master, name, system, description, cover_link) values ($1, $2, $3, $4, $5) returning id;",
		)
		.bind(master)
		.bind(name)
		.bind(system)
		.bind(descr)
		.bind(cover_link)
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
		let was_updated = sqlx::query_scalar::<_, bool>(
			"update companies set name = $1, system = $2, description = $3 where id = $4 and master = $5 returning true;",
		)
		.bind(data.name)
		.bind(data.system)
		.bind(data.description)
		.bind(company_id)
		.bind(master)
		.fetch_optional(&self.pool)
		.await?.unwrap_or_default();

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
	) -> CoreResult<Vec<Event>> {
		let mut qb: QueryBuilder<'_, Postgres> = QueryBuilder::new(
			"SELECT
					e.id
					, c.name AS company
					, c.id AS company_id
					, m.nickname AS master
					, m.id AS master_id
					, l.name AS location
					, l.id AS location_id
					, e.date
					, COALESCE(jsonb_agg(u.nickname) FILTER (WHERE u.nickname is not null), '[]') AS players
					, e.max_slots
					, e.plan_duration
					, bool_or(y.id is not null) AS you_applied
					, (",
		);
		qb.push_bind(player_id);
		qb.push(" is not null and c.master = ");
		qb.push_bind(player_id);
		qb.push(
			") as you_are_master
					, y.approval AS your_approval
				FROM events e
				INNER JOIN companies c
					ON c.id = e.company
				INNER JOIN locations l
					ON l.id = e.location",
		);

		if let Some(location_id) = query_args.location {
			qb.push(" AND l.id = ");
			qb.push_bind(location_id);
		}

		qb.push(" INNER JOIN users m ON m.id = c.master");

		if let Some(master_id) = query_args.master {
			qb.push(" AND m.id = ");
			qb.push_bind(master_id);
		} else if let Some(imamaster) = query_args.imamaster {
			if let Some(my_id) = player_id {
				match imamaster {
					true => qb.push(" AND m.id = "),
					false => qb.push(" AND m.id <> "),
				};
				qb.push_bind(my_id);
			}
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

		qb.push(" GROUP BY e.id, c.name, c.id, m.nickname, m.id, l.name, l.id, e.date, y.approval;");

		let events = qb.build_query_as::<Event>().fetch_all(&self.pool).await?;

		Ok(events)
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
				, e.date
				, COALESCE(jsonb_agg(u.nickname) FILTER (WHERE u.nickname is not null), '[]') AS players
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
			GROUP BY e.id, c.name, c.id, m.nickname, m.id, l.name, l.id, e.date, y.approval;",
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
				, bool_or(a.id is not null) AS already_applied
				, (e.max_slots is null or approved_slots.count < e.max_slots) as can_auto_approve
			from events e
			inner join companies c
				on c.id = e.company
			left join applications a
				on a.event = e.id
				and a.player = $2
			inner join approved_slots on true
			where e.id = $1
			group by e.id, c.master, approved_slots.count;",
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
