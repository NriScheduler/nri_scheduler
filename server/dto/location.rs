use serde::Deserialize;

#[derive(Deserialize)]
pub(crate) struct ReadLocationDto {
	#[serde(default)]
	pub name: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct NewLocationDto {
	pub name: String,
	#[serde(default)]
	pub address: Option<String>,
	#[serde(default)]
	pub description: Option<String>,
}
