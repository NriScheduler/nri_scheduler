use ::std::sync::Arc;
use axum::{
	Extension,
	extract::{Path, State},
};
use futures::try_join;
use uuid::Uuid;

use crate::{
	dto::{
		Dto,
		event::{NewEventDto, ReadEventsDto, UpdateEventDto},
	},
	repository::Repository,
	system_models::{AppError, AppResponse, AppResult},
};

pub(crate) async fn read_events_list(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Option<Uuid>>,
	Dto(query): Dto<ReadEventsDto>,
) -> AppResult {
	let events = repo.read_events_list(query, user_id).await?;

	let json_value = serde_json::to_value(events)?;

	return Ok(AppResponse::scenario_success(
		"Список событий",
		Some(json_value),
	));
}

pub(crate) async fn read_event(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Option<Uuid>>,
	Path(event_id): Path<Uuid>,
) -> AppResult {
	let event = repo.read_event(event_id, user_id).await?;

	let res = match event {
		None => {
			let payload = serde_json::to_value(event_id)?;
			AppResponse::scenario_fail("Событие не найдено", Some(payload))
		}
		Some(ev) => {
			let payload = serde_json::to_value(ev)?;
			AppResponse::scenario_success("Событие", Some(payload))
		}
	};

	Ok(res)
}

pub(crate) async fn add_event(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Uuid>,
	Dto(body): Dto<NewEventDto>,
) -> AppResult {
	try_join!(
		check_company(body.company, user_id, repo.clone()),
		check_location(body.location, repo.clone()),
	)?;

	let new_evt_id = repo
		.add_event(
			body.company,
			&body.location,
			body.date,
			body.max_slots,
			body.plan_duration,
		)
		.await?;

	return Ok(AppResponse::scenario_success(
		"Событие успешно создано",
		new_evt_id.into_api(),
	));
}

pub(crate) async fn apply_event(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Uuid>,
	Path(event_id): Path<Uuid>,
) -> AppResult {
	let event = repo.get_event_for_applying(event_id, user_id).await?;

	let Some(event) = event else {
		let payload = serde_json::to_value(event_id)?;
		return Ok(AppResponse::scenario_fail(
			"Событие не найдено",
			Some(payload),
		));
	};

	if event.you_are_master {
		let payload = serde_json::to_value(event_id)?;
		return Ok(AppResponse::scenario_fail(
			"Вы являетесь мастером на данном событии",
			Some(payload),
		));
	}

	if event.already_applied {
		let payload = serde_json::to_value(event_id)?;
		return Ok(AppResponse::scenario_fail(
			"Вы уже подали заявку на данное событие",
			Some(payload),
		));
	}

	let new_app_id = repo
		.apply_event(event_id, user_id, event.can_auto_approve)
		.await?;

	Ok(AppResponse::scenario_success(
		"Заявка на событие успешно создана",
		new_app_id.into_api(),
	))
}

pub(crate) async fn update_event(
	State(repo): State<Arc<Repository>>,
	Extension(master_id): Extension<Uuid>,
	Path(event_id): Path<Uuid>,
	Dto(body): Dto<UpdateEventDto>,
) -> AppResult {
	match repo.update_event(event_id, master_id, body).await? {
		false => Err(AppError::scenario_error("Игра не найдена", None::<&str>)),
		true => Ok(AppResponse::scenario_success("Данные игры обновлены", None)),
	}
}

async fn check_company(
	company_id: Uuid,
	user_id: Uuid,
	repo: Arc<Repository>,
) -> Result<(), AppError> {
	let Some(company) = repo.get_company_by_id(company_id).await? else {
		return AppError::scenario_error("Кампания не найдена", Some(company_id.to_string())).into();
	};

	if company.master != user_id {
		return AppError::scenario_error("Вы не можете управлять данной компанией", None::<&str>)
			.into();
	}

	Ok(())
}

async fn check_location(location_id: Option<Uuid>, repo: Arc<Repository>) -> Result<(), AppError> {
	if let Some(l_id) = location_id {
		let may_be_location = repo.get_location_by_id(l_id).await?;
		if may_be_location.is_none() {
			return AppError::scenario_error("Локация не найдена", Some(l_id.to_string())).into();
		}
	}

	Ok(())
}
