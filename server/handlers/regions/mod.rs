use ::std::sync::Arc;
use axum::extract::State;

use crate::{
	dto::{Dto, region::ReadCityDto},
	repository::models::{City, Region},
	state::AppState,
	system_models::{AppResponse, AppResult},
};

pub(crate) async fn read_regions_list(State(state): State<Arc<AppState>>) -> AppResult {
	let regions = state.repo.read_regions_list().await?;

	let json_value = serde_json::to_value(regions)?;

	return Ok(AppResponse::scenario_success(
		"Список регионов",
		Some(json_value),
	));
}

pub(crate) async fn add_region(
	State(state): State<Arc<AppState>>,
	Dto(body): Dto<Region>,
) -> AppResult {
	state.repo.add_region(body).await?;

	return Ok(AppResponse::scenario_success("Регион добавлен", None));
}

pub(crate) async fn read_cities_list(
	State(state): State<Arc<AppState>>,
	Dto(ReadCityDto { region }): Dto<ReadCityDto>,
) -> AppResult {
	let cities = state.repo.read_cities_list(region).await?;

	let json_value = serde_json::to_value(cities)?;

	return Ok(AppResponse::scenario_success(
		"Список городов",
		Some(json_value),
	));
}

pub(crate) async fn add_city(
	State(state): State<Arc<AppState>>,
	Dto(body): Dto<City>,
) -> AppResult {
	state.repo.add_city(body).await?;

	return Ok(AppResponse::scenario_success("Город добавлен", None));
}
