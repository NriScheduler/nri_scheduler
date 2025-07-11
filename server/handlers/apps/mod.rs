use ::std::sync::Arc;
use axum::{
	Extension,
	extract::{Path, State},
};
use chrono::Utc;
use uuid::Uuid;

use crate::{
	state::AppState,
	system_models::{AppResponse, AppResult},
};

pub(crate) async fn read_player_apps_list(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
) -> AppResult {
	let apps = state.repo.read_player_apps_list(user_id).await?;

	let json_value = serde_json::to_value(apps)?;

	return Ok(AppResponse::scenario_success(
		"Список Ваших заявок",
		Some(json_value),
	));
}

pub(crate) async fn read_player_app(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(app_id): Path<Uuid>,
) -> AppResult {
	let may_be_app = state.repo.read_player_app(user_id, app_id).await?;
	let msg = may_be_app
		.as_ref()
		.map(|_| "Ваша заявка")
		.unwrap_or("Заявка не найдена");

	let payload = may_be_app.map(serde_json::to_value).transpose()?;

	return Ok(AppResponse::scenario_success(msg, payload));
}

pub(crate) async fn read_player_app_by_event(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(event_id): Path<Uuid>,
) -> AppResult {
	let may_be_app = state
		.repo
		.read_player_app_by_event(user_id, event_id)
		.await?;

	let msg = may_be_app
		.as_ref()
		.map(|_| "Ваша заявка")
		.unwrap_or("Заявка не найдена");

	let payload = may_be_app.map(serde_json::to_value).transpose()?;

	return Ok(AppResponse::scenario_success(msg, payload));
}

pub(crate) async fn read_player_app_company_closest(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(company_id): Path<Uuid>,
) -> AppResult {
	let may_be_app = state
		.repo
		.read_player_app_company_closest(user_id, company_id)
		.await?;

	let msg = may_be_app
		.as_ref()
		.map(|_| "Ваша заявка на ближайшую игру кампании")
		.unwrap_or("Заявка не найдена");

	let payload = may_be_app.map(serde_json::to_value).transpose()?;

	return Ok(AppResponse::scenario_success(msg, payload));
}

pub(crate) async fn read_master_apps_list(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
) -> AppResult {
	let apps = state.repo.read_master_apps_list(user_id).await?;

	let json_value = serde_json::to_value(apps)?;

	return Ok(AppResponse::scenario_success(
		"Список заявок на Ваши игры",
		Some(json_value),
	));
}

pub(crate) async fn read_master_apps_list_by_event(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(event_id): Path<Uuid>,
) -> AppResult {
	let apps = state
		.repo
		.read_master_apps_list_by_event(user_id, event_id)
		.await?;

	let json_value = serde_json::to_value(apps)?;

	return Ok(AppResponse::scenario_success(
		"Список заявок на игру",
		Some(json_value),
	));
}

pub(crate) async fn read_master_apps_list_company_closest(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(company_id): Path<Uuid>,
) -> AppResult {
	let apps = state
		.repo
		.read_master_apps_list_company_closest(user_id, company_id)
		.await?;

	let json_value = serde_json::to_value(apps)?;

	return Ok(AppResponse::scenario_success(
		"Список заявок на ближайшую игру кампании",
		Some(json_value),
	));
}

pub(crate) async fn read_master_app(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(app_id): Path<Uuid>,
) -> AppResult {
	let may_be_app = state.repo.read_master_app(user_id, app_id).await?;

	let msg = may_be_app
		.as_ref()
		.map(|_| "Заявка на вашу игру")
		.unwrap_or("Заявка не найдена");

	let payload = may_be_app.map(serde_json::to_value).transpose()?;

	return Ok(AppResponse::scenario_success(msg, payload));
}

pub(crate) async fn approve_app(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(app_id): Path<Uuid>,
) -> AppResult {
	let may_be_app = state.repo.read_app_for_approval(user_id, app_id).await?;

	let Some(app) = may_be_app else {
		let payload = serde_json::to_value(app_id)?;
		return Ok(AppResponse::scenario_fail(
			"Заявка не найдена",
			Some(payload),
		));
	};

	if app.approval.unwrap_or_default() {
		let payload = serde_json::to_value(app_id)?;
		return Ok(AppResponse::scenario_fail(
			"Заявка уже была одобрена",
			Some(payload),
		));
	}

	if app.event_cancelled {
		let payload = serde_json::to_value(app_id)?;
		return Ok(AppResponse::scenario_fail(
			"Событие отменено",
			Some(payload),
		));
	}

	if app.event_date < Utc::now() {
		let payload = serde_json::to_value(app_id)?;
		return Ok(AppResponse::scenario_fail(
			"Событие уже окончено",
			Some(payload),
		));
	}

	state.repo.approve_app(app_id).await?;

	Ok(AppResponse::scenario_success(
		"Заявка на событие успешно одобрена",
		None,
	))
}

pub(crate) async fn reject_app(
	State(state): State<Arc<AppState>>,
	Extension(user_id): Extension<Uuid>,
	Path(app_id): Path<Uuid>,
) -> AppResult {
	let may_be_app = state.repo.read_app_for_approval(user_id, app_id).await?;

	let Some(app) = may_be_app else {
		let payload = serde_json::to_value(app_id)?;
		return Ok(AppResponse::scenario_fail(
			"Заявка не найдена",
			Some(payload),
		));
	};

	if app.approval.is_some() && !app.approval.unwrap_or_default() {
		let payload = serde_json::to_value(app_id)?;
		return Ok(AppResponse::scenario_fail(
			"Заявка уже была отклонена",
			Some(payload),
		));
	}

	if app.event_cancelled {
		let payload = serde_json::to_value(app_id)?;
		return Ok(AppResponse::scenario_fail(
			"Событие отменено",
			Some(payload),
		));
	}

	if app.event_date < Utc::now() {
		let payload = serde_json::to_value(app_id)?;
		return Ok(AppResponse::scenario_fail(
			"Событие уже окончено",
			Some(payload),
		));
	}

	state.repo.reject_app(app_id).await?;

	Ok(AppResponse::scenario_success(
		"Заявка на событие успешно отклонена",
		None,
	))
}
