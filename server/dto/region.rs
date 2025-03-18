use serde::Deserialize;

#[derive(Deserialize)]
pub(crate) struct ReadCityDto {
	#[serde(default)]
	pub region: Option<String>,
}
