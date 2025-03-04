mod implementations;
pub(crate) mod models;

use chrono::{DateTime, FixedOffset};
use implementations::PostgresStore;
use models::{Company, Event, EventForApplying, Location, Profile, SelfInfo, UserForAuth};
use uuid::Uuid;

use crate::{
	auth,
	dto::{
		company::{ApiCompanyDto, ReadCompaniesDto},
		event::ReadEventsDto,
		location::ReadLocationDto,
	},
	shared::RecordId,
	system_models::{CoreResult, ServingError},
};

// TODO: разделить на разные репозитоии, только пока не знаю как
trait Store {
	async fn registration(
		&self,
		nickname: &str,
		email: &str,
		hashed_pass: &str,
		timezone_offset: Option<i16>,
	) -> CoreResult;
	async fn get_user_for_signing_in(&self, email: &str) -> CoreResult<Option<UserForAuth>>;
	async fn read_profile(&self, user_id: Uuid) -> CoreResult<Option<Profile>>;
	async fn who_i_am(&self, user_id: Uuid) -> CoreResult<Option<SelfInfo>>;

	async fn get_locations_list(&self, query: ReadLocationDto) -> CoreResult<Vec<Location>>;
	async fn get_location_by_id(&self, location_id: Uuid) -> CoreResult<Option<Location>>;

	async fn add_location(
		&self,
		name: &str,
		address: &Option<String>,
		descr: &Option<String>,
	) -> CoreResult<RecordId>;

	async fn get_company_by_id(&self, company_id: Uuid) -> CoreResult<Option<Company>>;

	async fn get_my_companies(
		&self,
		query: ReadCompaniesDto,
		master: Uuid,
	) -> CoreResult<Vec<Company>>;

	async fn add_company(
		&self,
		master: Uuid,
		name: &str,
		system: &str,
		descr: &Option<String>,
	) -> CoreResult<RecordId>;

	async fn update_company(
		&self,
		company_id: Uuid,
		master: Uuid,
		data: ApiCompanyDto,
	) -> CoreResult<bool>;

	async fn read_events_list(
		&self,
		query: ReadEventsDto,
		player_id: Option<Uuid>,
	) -> CoreResult<Vec<Event>>;

	async fn read_event(&self, event_id: Uuid, player_id: Option<Uuid>)
	-> CoreResult<Option<Event>>;

	async fn get_event_for_applying(
		&self,
		event_id: Uuid,
		player_id: Uuid,
	) -> CoreResult<Option<EventForApplying>>;

	async fn apply_event(
		&self,
		event_id: Uuid,
		player_id: Uuid,
		can_auto_approve: bool,
	) -> CoreResult<RecordId>;

	async fn add_event(
		&self,
		company: Uuid,
		location: &Option<Uuid>,
		date: DateTime<FixedOffset>,
		max_slots: Option<i16>,
		plan_duration: Option<i16>,
	) -> CoreResult<RecordId>;

	async fn close(&self);
}

pub struct Repository {
	store: PostgresStore,
}

impl Repository {
	pub async fn new() -> Result<Self, ServingError> {
		return Ok(Self {
			store: PostgresStore::new().await?,
		});
	}

	pub(crate) async fn registration(
		&self,
		nickname: &str,
		email: &str,
		password: &str,
		timezone_offset: Option<i16>,
	) -> CoreResult {
		let hashed_pass = auth::hash_password(password)?;

		return self
			.store
			.registration(nickname, email, &hashed_pass, timezone_offset)
			.await;
	}

	pub(crate) async fn get_user_for_signing_in(
		&self,
		email: &str,
	) -> CoreResult<Option<UserForAuth>> {
		return self.store.get_user_for_signing_in(email).await;
	}

	pub(crate) async fn read_profile(&self, user_id: Uuid) -> CoreResult<Option<Profile>> {
		return self.store.read_profile(user_id).await;
	}

	pub(crate) async fn who_i_am(&self, user_id: Uuid) -> CoreResult<Option<SelfInfo>> {
		return self.store.who_i_am(user_id).await;
	}

	pub(crate) async fn get_locations_list(
		&self,
		query: ReadLocationDto,
	) -> CoreResult<Vec<Location>> {
		return self.store.get_locations_list(query).await;
	}

	pub(crate) async fn get_location_by_id(
		&self,
		location_id: Uuid,
	) -> CoreResult<Option<Location>> {
		return self.store.get_location_by_id(location_id).await;
	}

	pub(crate) async fn add_location(
		&self,
		name: &str,
		address: &Option<String>,
		descr: &Option<String>,
	) -> CoreResult<RecordId> {
		return self.store.add_location(name, address, descr).await;
	}

	pub(crate) async fn get_company_by_id(&self, company_id: Uuid) -> CoreResult<Option<Company>> {
		return self.store.get_company_by_id(company_id).await;
	}

	pub(crate) async fn get_my_companies(
		&self,
		query: ReadCompaniesDto,
		master: Uuid,
	) -> CoreResult<Vec<Company>> {
		return self.store.get_my_companies(query, master).await;
	}

	pub(crate) async fn add_company(
		&self,
		master: Uuid,
		name: &str,
		system: &str,
		descr: &Option<String>,
	) -> CoreResult<RecordId> {
		return self.store.add_company(master, name, system, descr).await;
	}

	pub(crate) async fn update_company(
		&self,
		company_id: Uuid,
		master: Uuid,
		data: ApiCompanyDto,
	) -> CoreResult<bool> {
		return self.store.update_company(company_id, master, data).await;
	}

	pub(crate) async fn read_events_list(
		&self,
		query: ReadEventsDto,
		player_id: Option<Uuid>,
	) -> CoreResult<Vec<Event>> {
		return self.store.read_events_list(query, player_id).await;
	}

	pub(crate) async fn read_event(
		&self,
		event_id: Uuid,
		player_id: Option<Uuid>,
	) -> CoreResult<Option<Event>> {
		return self.store.read_event(event_id, player_id).await;
	}

	pub(crate) async fn get_event_for_applying(
		&self,
		event_id: Uuid,
		player_id: Uuid,
	) -> CoreResult<Option<EventForApplying>> {
		return self.store.get_event_for_applying(event_id, player_id).await;
	}

	pub(crate) async fn apply_event(
		&self,
		event_id: Uuid,
		player_id: Uuid,
		can_auto_approve: bool,
	) -> CoreResult<RecordId> {
		return self
			.store
			.apply_event(event_id, player_id, can_auto_approve)
			.await;
	}

	pub(crate) async fn add_event(
		&self,
		company: Uuid,
		location: &Option<Uuid>,
		date: DateTime<FixedOffset>,
		max_slots: Option<i16>,
		plan_duration: Option<i16>,
	) -> CoreResult<RecordId> {
		return self
			.store
			.add_event(company, location, date, max_slots, plan_duration)
			.await;
	}

	pub async fn close(&self) {
		return self.store.close().await;
	}
}
