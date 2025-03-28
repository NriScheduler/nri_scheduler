mod implementations;
pub(crate) mod models;

use ::std::error::Error;
use chrono::{DateTime, FixedOffset};
use implementations::PostgresStore;
use models::{
	City, Company, CompanyInfo, Event, EventForApplying, Location, Profile, Region, UserForAuth,
};
use uuid::Uuid;

use crate::{
	auth,
	dto::{
		auth::UpdateProfileDto,
		company::{ApiUpdateCompanyDto, ReadCompaniesDto},
		event::{ReadEventsDto, UpdateEventDto},
		location::ReadLocationDto,
	},
	shared::RecordId,
	system_models::CoreResult,
};

// TODO: разделить на разные репозитоии, только пока не знаю как
trait Store {
	async fn registration(
		&self,
		nickname: &str,
		email: &str,
		hashed_pass: &str,
		timezone_offset: Option<i16>,
	) -> CoreResult<Uuid>;
	async fn get_user_for_signing_in(&self, email: &str) -> CoreResult<Option<UserForAuth>>;
	async fn read_profile(&self, user_id: Uuid) -> CoreResult<Option<Profile>>;
	async fn update_profile(&self, user_id: Uuid, profile: UpdateProfileDto) -> CoreResult;
	async fn get_avatar_link(&self, user_id: Uuid) -> CoreResult<Option<String>>;
	async fn set_avatar(&self, user_id: Uuid, url: &str) -> CoreResult;
	async fn verify_email(&self, verification_id: Uuid) -> CoreResult<Option<(bool, bool)>>;
	async fn send_email_verification(&self, user_id: Uuid) -> CoreResult<(Uuid, String)>;

	async fn get_locations_list(&self, query: ReadLocationDto) -> CoreResult<Vec<Location>>;
	async fn get_location_by_id(&self, location_id: Uuid) -> CoreResult<Option<Location>>;

	async fn add_location(
		&self,
		name: &str,
		address: &Option<String>,
		descr: &Option<String>,
	) -> CoreResult<RecordId>;

	async fn get_company_by_id(
		&self,
		company_id: Uuid,
		user_id: Option<Uuid>,
	) -> CoreResult<Option<CompanyInfo>>;

	async fn get_company_cover(&self, company_id: Uuid) -> CoreResult<Option<String>>;

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
		cover_link: &Option<String>,
	) -> CoreResult<RecordId>;

	async fn update_company(
		&self,
		company_id: Uuid,
		master: Uuid,
		data: ApiUpdateCompanyDto,
	) -> CoreResult<bool>;

	async fn set_cover(
		&self,
		master_id: Uuid,
		company_id: Uuid,
		cover_link: &str,
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

	async fn update_event(
		&self,
		event_id: Uuid,
		master: Uuid,
		data: UpdateEventDto,
	) -> CoreResult<bool>;

	async fn read_regions_list(&self) -> CoreResult<Vec<Region>>;
	async fn read_cities_list(&self, region: Option<String>) -> CoreResult<Vec<City>>;
	async fn add_city(&self, city: City) -> CoreResult;

	async fn close(&self);
}

pub struct Repository {
	store: PostgresStore,
}

impl Repository {
	pub async fn new() -> Result<Self, Box<dyn Error>> {
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
	) -> CoreResult<Uuid> {
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

	pub(crate) async fn update_profile(
		&self,
		user_id: Uuid,
		profile: UpdateProfileDto,
	) -> CoreResult {
		return self.store.update_profile(user_id, profile).await;
	}

	pub(crate) async fn get_avatar_link(&self, user_id: Uuid) -> CoreResult<Option<String>> {
		return self.store.get_avatar_link(user_id).await;
	}

	pub(crate) async fn set_avatar(&self, user_id: Uuid, url: &str) -> CoreResult {
		return self.store.set_avatar(user_id, url).await;
	}

	pub(crate) async fn verify_email(
		&self,
		verification_id: Uuid,
	) -> CoreResult<Option<(bool, bool)>> {
		return self.store.verify_email(verification_id).await;
	}

	pub(crate) async fn send_email_verification(&self, user_id: Uuid) -> CoreResult<(Uuid, String)> {
		return self.store.send_email_verification(user_id).await;
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

	pub(crate) async fn get_company_by_id(
		&self,
		company_id: Uuid,
		user_id: Option<Uuid>,
	) -> CoreResult<Option<CompanyInfo>> {
		return self.store.get_company_by_id(company_id, user_id).await;
	}

	pub(crate) async fn get_company_cover(&self, company_id: Uuid) -> CoreResult<Option<String>> {
		return self.store.get_company_cover(company_id).await;
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
		cover_link: &Option<String>,
	) -> CoreResult<RecordId> {
		return self
			.store
			.add_company(master, name, system, descr, cover_link)
			.await;
	}

	pub(crate) async fn update_company(
		&self,
		company_id: Uuid,
		master: Uuid,
		data: ApiUpdateCompanyDto,
	) -> CoreResult<bool> {
		return self.store.update_company(company_id, master, data).await;
	}

	pub(crate) async fn set_cover(
		&self,
		master_id: Uuid,
		company_id: Uuid,
		cover_link: &str,
	) -> CoreResult<bool> {
		return self
			.store
			.set_cover(master_id, company_id, cover_link)
			.await;
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

	pub(crate) async fn update_event(
		&self,
		event_id: Uuid,
		master: Uuid,
		data: UpdateEventDto,
	) -> CoreResult<bool> {
		return self.store.update_event(event_id, master, data).await;
	}

	pub(crate) async fn read_regions_list(&self) -> CoreResult<Vec<Region>> {
		return self.store.read_regions_list().await;
	}

	pub(crate) async fn read_cities_list(&self, region: Option<String>) -> CoreResult<Vec<City>> {
		return self.store.read_cities_list(region).await;
	}

	pub(crate) async fn add_city(&self, city: City) -> CoreResult {
		return self.store.add_city(city).await;
	}

	pub async fn close(&self) {
		return self.store.close().await;
	}
}
