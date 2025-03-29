use ::std::sync::Arc;
use axum::extract::State;

use crate::{
	dto::{Dto, region::ReadCityDto},
	repository::{
		Repository,
		models::{City, Region},
	},
	system_models::{AppResponse, AppResult},
};

pub(crate) async fn read_regions_list(State(repo): State<Arc<Repository>>) -> AppResult {
	let regions = repo.read_regions_list().await?;

	let json_value = serde_json::to_value(regions)?;

	return Ok(AppResponse::scenario_success(
		"Список регионов",
		Some(json_value),
	));
}

pub(crate) async fn add_region(
	State(repo): State<Arc<Repository>>,
	Dto(body): Dto<Region>,
) -> AppResult {
	repo.add_region(body).await?;

	return Ok(AppResponse::scenario_success("Регион добавлен", None));
}

pub(crate) async fn read_cities_list(
	State(repo): State<Arc<Repository>>,
	Dto(ReadCityDto { region }): Dto<ReadCityDto>,
) -> AppResult {
	let cities = repo.read_cities_list(region).await?;

	let json_value = serde_json::to_value(cities)?;

	return Ok(AppResponse::scenario_success(
		"Список городов",
		Some(json_value),
	));
}

pub(crate) async fn add_city(
	State(repo): State<Arc<Repository>>,
	Dto(body): Dto<City>,
) -> AppResult {
	repo.add_city(body).await?;

	return Ok(AppResponse::scenario_success("Город добавлен", None));
}
