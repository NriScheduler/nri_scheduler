use chrono::{DateTime, Utc};
use derive_masked::DebugMasked;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, types::Json as SqlxJson};
use uuid::Uuid;

#[derive(DebugMasked, Deserialize, Serialize, FromRow)]
pub(crate) struct UserForAuth {
	pub id: Uuid,
	#[masked]
	pub pw_hash: String,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub(crate) struct User {
	pub id: Uuid,
	pub nickname: String,
	pub phone: Option<String>,
	pub email: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub(crate) struct Profile {
	pub nickname: String,
	pub phone: Option<String>,
	pub email: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub(crate) struct Company {
	pub id: Uuid,
	pub master: Uuid,
	pub name: String,
	pub system: String,
	pub description: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub(crate) struct Location {
	pub id: Uuid,
	pub name: String,
	pub address: Option<String>,
	pub description: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub(crate) struct Event {
	pub id: Uuid,
	pub company: String,
	pub company_id: Uuid,
	pub master: String,
	pub master_id: Uuid,
	pub location: String,
	pub location_id: Uuid,
	pub date: DateTime<Utc>,
	pub players: SqlxJson<Vec<String>>,
	pub max_slots: Option<i16>,
	pub plan_duration: Option<i16>,
	pub you_applied: bool,
	pub you_are_master: bool,
	pub your_approval: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub(crate) struct EventForApplying {
	pub id: Uuid,
	pub you_are_master: bool,
	pub already_applied: bool,
	pub can_auto_approve: bool,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub(crate) struct SelfInfo {
	pub id: Uuid,
	pub timezone_offset: Option<i16>,
}
