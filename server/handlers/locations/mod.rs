use ::std::sync::Arc;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::{
	dto::{
		Dto,
		location::{NewLocationDto, ReadLocationDto},
	},
	repository::Repository,
	system_models::{AppResponse, AppResult},
};

pub(crate) async fn get_locations_list(
	State(repo): State<Arc<Repository>>,
	Dto(query): Dto<ReadLocationDto>,
) -> AppResult {
	let locations = repo.get_locations_list(query).await?;

	let json_value = serde_json::to_value(locations)?;

	return Ok(AppResponse::scenario_success(
		"Список локаций",
		Some(json_value),
	));
}

pub(crate) async fn get_location_by_id(
	State(repo): State<Arc<Repository>>,
	Path(location_id): Path<Uuid>,
) -> AppResult {
	let maybe_location = repo.get_location_by_id(location_id).await?;

	Ok(match maybe_location {
		None => AppResponse::scenario_fail("Локация не найдена", None),
		Some(location) => {
			let payload = serde_json::to_value(location)?;
			AppResponse::scenario_success("Информация о локации", Some(payload))
		}
	})
}

pub(crate) async fn add_location(
	State(repo): State<Arc<Repository>>,
	Dto(body): Dto<NewLocationDto>,
) -> AppResult {
	if !validate_map_link(&body.map_link) {
		return Ok(AppResponse::scenario_fail(
			"Некорректная ссылка на карту. Разрешены только сервисы 2gis, Яндекс Карты и Google Maps",
			None,
		));
	}

	let new_loc_id = repo
		.add_location(
			&body.name,
			&body.address,
			&body.description,
			&body.city,
			&body.map_link,
		)
		.await?;

	return Ok(AppResponse::scenario_success(
		"Локация успешно добавлена",
		new_loc_id.into_api(),
	));
}

fn validate_map_link(map_link: &Option<String>) -> bool {
	map_link.as_ref().is_none_or(|link| {
		link.starts_with("https://2gis.ru/")
			|| link.starts_with("https://yandex.ru/maps/")
			|| link.starts_with("https://google.ru/maps/")
			|| link.starts_with("https://www/google.ru/maps/")
			|| link.starts_with("https://google.com/maps/")
			|| link.starts_with("https://www/google.com/maps/")
	})
}
