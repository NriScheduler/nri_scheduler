use serde::Deserialize;

use crate::shared::deser_empty_str_as_none;

#[derive(Deserialize)]
pub(crate) struct ReadLocationDto {
	#[serde(default, deserialize_with = "deser_empty_str_as_none")]
	pub name: Option<String>,
	#[serde(default, deserialize_with = "deser_empty_str_as_none")]
	pub region: Option<String>,
	#[serde(default, deserialize_with = "deser_empty_str_as_none")]
	pub city: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct NewLocationDto {
	pub name: String,
	#[serde(default, deserialize_with = "deser_empty_str_as_none")]
	pub address: Option<String>,
	#[serde(default, deserialize_with = "deser_empty_str_as_none")]
	pub description: Option<String>,
	#[serde(default, deserialize_with = "deser_empty_str_as_none")]
	pub city: Option<String>,
	#[serde(default, deserialize_with = "deser_empty_str_as_none")]
	pub map_link: Option<String>,
}
