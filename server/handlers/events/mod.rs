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
	state::AppState,
	system_models::{AppError, AppResponse, AppResult},
};

const FULL_UTC_TEMPLATE: &str = "%Y-%m-%dT%H:%M:%SZ";

pub(crate) async fn read_events_list(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Option<Uuid>>,
	Dto(query): Dto<ReadEventsDto>,
) -> AppResult {
	let events = state.repo.read_events_list(query, user_id).await?;

	let json_value = serde_json::to_value(events)?;

	return Ok(AppResponse::scenario_success(
		"Список событий",
		Some(json_value),
	));
}

pub(crate) async fn read_event(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Option<Uuid>>,
	Path(event_id): Path<Uuid>,
) -> AppResult {
	let event = state.repo.read_event(event_id, user_id).await?;

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
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Dto(body): Dto<NewEventDto>,
) -> AppResult {
	try_join!(
		check_company(body.company, user_id, &state.repo),
		check_location(body.location, &state.repo),
	)?;

	let new_evt_id = state
		.repo
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
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(event_id): Path<Uuid>,
) -> AppResult {
	let event = state.repo.get_event_for_applying(event_id, user_id).await?;

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

	if event.cancelled {
		let payload = serde_json::to_value(event_id)?;
		return Ok(AppResponse::scenario_fail(
			"Событие отменено",
			Some(payload),
		));
	}

	let new_app_id = state
		.repo
		.apply_event(event_id, user_id, event.can_auto_approve)
		.await?;

	state
		.message_sender
		.send((
			Some(event.master_id),
			format!(
				r#"На игру по кампании "{}" на {} записался игрок"#,
				event.company_name,
				event.event_date.format(FULL_UTC_TEMPLATE)
			),
		))
		.ok();

	Ok(AppResponse::scenario_success(
		"Заявка на событие успешно создана",
		new_app_id.into_api(),
	))
}

pub(crate) async fn update_event(
	State(state): State<Arc<AppState>>,
	Extension(master_id): Extension<Uuid>,
	Path(event_id): Path<Uuid>,
	Dto(body): Dto<UpdateEventDto>,
) -> AppResult {
	match state.repo.update_event(event_id, master_id, body).await? {
		false => Err(AppError::scenario_error("Игра не найдена", None::<&str>)),
		true => Ok(AppResponse::scenario_success("Данные игры обновлены", None)),
	}
}

pub(crate) async fn cancel_event(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(event_id): Path<Uuid>,
) -> AppResult {
	let event = state.repo.read_event(event_id, Some(user_id)).await?;

	let Some(event) = event else {
		let payload = serde_json::to_value(event_id)?;
		return Ok(AppResponse::scenario_fail(
			"Событие не найдено",
			Some(payload),
		));
	};

	if !event.you_are_master {
		let payload = serde_json::to_value(event_id)?;
		return Ok(AppResponse::scenario_fail(
			"Вы не являетесь мастером на данном событии",
			Some(payload),
		));
	}

	state.repo.cancel_event(event_id).await?;

	Ok(AppResponse::scenario_success("Событие отменено", None))
}

pub(crate) async fn reopen_event(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(event_id): Path<Uuid>,
) -> AppResult {
	let event = state.repo.read_event(event_id, Some(user_id)).await?;

	let Some(event) = event else {
		let payload = serde_json::to_value(event_id)?;
		return Ok(AppResponse::scenario_fail(
			"Событие не найдено",
			Some(payload),
		));
	};

	if !event.you_are_master {
		let payload = serde_json::to_value(event_id)?;
		return Ok(AppResponse::scenario_fail(
			"Вы не являетесь мастером на данном событии",
			Some(payload),
		));
	}

	state.repo.reopen_event(event_id).await?;

	Ok(AppResponse::scenario_success("Событие отменено", None))
}

async fn check_company(company_id: Uuid, user_id: Uuid, repo: &Repository) -> Result<(), AppError> {
	let Some(company) = repo.get_company_by_id(company_id, Some(user_id)).await? else {
		return AppError::scenario_error("Кампания не найдена", Some(company_id.to_string())).into();
	};

	if company.master != user_id {
		return AppError::scenario_error("Вы не можете управлять данной кампанией", None::<&str>)
			.into();
	}

	Ok(())
}

async fn check_location(location_id: Option<Uuid>, repo: &Repository) -> Result<(), AppError> {
	if let Some(l_id) = location_id {
		let may_be_location = repo.get_location_by_id(l_id).await?;
		if may_be_location.is_none() {
			return AppError::scenario_error("Локация не найдена", Some(l_id.to_string())).into();
		}
	}

	Ok(())
}
