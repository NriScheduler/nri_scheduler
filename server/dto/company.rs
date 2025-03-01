use serde::Deserialize;

#[derive(Deserialize)]
pub(crate) struct ReadCompaniesDto {
	#[serde(default)]
	pub name: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct NewCompanyDto {
	pub name: String,
	pub system: String,
	#[serde(default)]
	pub description: Option<String>,
}
