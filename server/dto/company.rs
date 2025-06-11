use serde::Deserialize;

use crate::shared::deserialize_missed;

#[derive(Deserialize)]
pub(crate) struct ReadCompaniesDto {
	#[serde(default)]
	pub name: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct ApiCompanyDto {
	pub name: String,
	pub system: String,
	#[serde(default)]
	pub description: Option<String>,
	#[serde(default)]
	pub cover_link: Option<String>,
	#[serde(default)]
	pub event_style: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct ApiUpdateCompanyDto {
	#[serde(default, deserialize_with = "deserialize_missed")]
	pub name: Option<Option<String>>,
	#[serde(default, deserialize_with = "deserialize_missed")]
	pub system: Option<Option<String>>,
	#[serde(default, deserialize_with = "deserialize_missed")]
	pub description: Option<Option<String>>,
	#[serde(default, deserialize_with = "deserialize_missed")]
	pub event_style: Option<Option<String>>,
}

impl ApiUpdateCompanyDto {
	pub fn is_empty(&self) -> bool {
		self.name.is_none() && self.system.is_none() && self.description.is_none()
	}
}
