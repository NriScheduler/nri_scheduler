use serde::Deserialize;

#[derive(Deserialize)]
pub(crate) struct ReadLocationDto {
	#[serde(default)]
	pub name: Option<String>,
	#[serde(default)]
	pub region: Option<String>,
	#[serde(default)]
	pub city: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct NewLocationDto {
	pub name: String,
	#[serde(default)]
	pub address: Option<String>,
	#[serde(default)]
	pub description: Option<String>,
	#[serde(default)]
	pub city: Option<String>,
}
