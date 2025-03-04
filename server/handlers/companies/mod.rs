use ::std::sync::Arc;
use axum::{
	Extension,
	extract::{Path, State},
};
use uuid::Uuid;

use crate::{
	dto::{
		Dto,
		company::{ApiCompanyDto, ReadCompaniesDto},
	},
	repository::Repository,
	system_models::{AppError, AppResponse, AppResult},
};

pub(crate) async fn get_company_by_id(
	State(repo): State<Arc<Repository>>,
	Path(company_id): Path<Uuid>,
) -> AppResult {
	let maybe_company = repo.get_company_by_id(company_id).await?;

	Ok(match maybe_company {
		None => AppResponse::scenario_fail("Кампания не найдена", None),
		Some(company) => {
			let payload = serde_json::to_value(company)?;
			AppResponse::scenario_success("Информация о кампании", Some(payload))
		}
	})
}

pub(crate) async fn get_my_companies(
	State(repo): State<Arc<Repository>>,
	Extension(master_id): Extension<Uuid>,
	Dto(query): Dto<ReadCompaniesDto>,
) -> AppResult {
	let my = repo.get_my_companies(query, master_id).await?;

	let json_value = serde_json::to_value(my)?;

	return Ok(AppResponse::scenario_success(
		"Список кампаний мастера",
		Some(json_value),
	));
}

pub(crate) async fn add_company(
	State(repo): State<Arc<Repository>>,
	Extension(master_id): Extension<Uuid>,
	Dto(body): Dto<ApiCompanyDto>,
) -> AppResult {
	let new_comp_id = repo
		.add_company(master_id, &body.name, &body.system, &body.description)
		.await?;

	return Ok(AppResponse::scenario_success(
		"Кампания успешно создана",
		new_comp_id.into_api(),
	));
}

pub(crate) async fn update_company(
	State(repo): State<Arc<Repository>>,
	Extension(master_id): Extension<Uuid>,
	Path(company_id): Path<Uuid>,
	Dto(body): Dto<ApiCompanyDto>,
) -> AppResult {
	match repo.update_company(company_id, master_id, body).await? {
		false => Err(AppError::scenario_error(
			"Кампания не найдена",
			None::<&str>,
		)),
		true => Ok(AppResponse::scenario_success(
			"Данные кампании обновлены",
			None,
		)),
	}
}
