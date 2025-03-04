use chrono::{DateTime, FixedOffset};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub(crate) struct ReadEventsDto {
	pub date_from: DateTime<FixedOffset>,
	pub date_to: DateTime<FixedOffset>,

	#[serde(default)]
	pub master: Option<Uuid>,
	#[serde(default)]
	pub location: Option<Uuid>,
	#[serde(default)]
	pub applied: Option<bool>,
	#[serde(default)]
	pub not_rejected: Option<bool>,
	#[serde(default)]
	pub imamaster: Option<bool>,
}

#[derive(Deserialize)]
pub(crate) struct NewEventDto {
	pub company: Uuid,
	#[serde(default)]
	pub location: Option<Uuid>,
	pub date: DateTime<FixedOffset>,
	#[serde(default)]
	pub max_slots: Option<i16>,
	#[serde(default)]
	pub plan_duration: Option<i16>,
}

#[derive(Deserialize)]
pub(crate) struct UpdateEventDto {
	#[serde(default)]
	pub location: Option<Uuid>,
	pub date: DateTime<FixedOffset>,
	#[serde(default)]
	pub max_slots: Option<i16>,
	#[serde(default)]
	pub plan_duration: Option<i16>,
}
