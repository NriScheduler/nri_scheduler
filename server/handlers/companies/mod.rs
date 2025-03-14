use ::std::sync::Arc;
use axum::{
	Extension,
	extract::{Path, State},
	response::Response,
};
use uuid::Uuid;

use crate::{
	dto::{
		Dto, FileLinkDto,
		company::{ApiCompanyDto, ApiUpdateCompanyDto, ReadCompaniesDto},
	},
	image,
	repository::Repository,
	system_models::{AppError, AppResponse, AppResult},
};

pub(crate) async fn get_company_by_id(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Option<Uuid>>,
	Path(company_id): Path<Uuid>,
) -> AppResult {
	let maybe_company = repo.get_company_by_id(company_id, user_id).await?;

	Ok(match maybe_company {
		None => AppResponse::scenario_fail("Кампания не найдена", None),
		Some(company) => {
			let payload = serde_json::to_value(company)?;
			AppResponse::scenario_success("Информация о кампании", Some(payload))
		}
	})
}

pub(crate) async fn read_company_cover(
	State(repo): State<Arc<Repository>>,
	Path(company_id): Path<Uuid>,
) -> Response {
	image::serve(repo.get_company_cover(company_id)).await
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
	if let Some(ref cover_link) = body.cover_link {
		image::check_remote_file(cover_link).await?;
	}

	let new_comp_id = repo
		.add_company(
			master_id,
			&body.name,
			&body.system,
			&body.description,
			&body.cover_link,
		)
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
	Dto(body): Dto<ApiUpdateCompanyDto>,
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

pub(crate) async fn set_cover(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Uuid>,
	Path(company_id): Path<Uuid>,
	Dto(body): Dto<FileLinkDto>,
) -> AppResult {
	image::check_remote_file(&body.url).await?;

	match repo.set_cover(user_id, company_id, &body.url).await? {
		false => Err(AppError::scenario_error(
			"Кампания не найдена",
			None::<&str>,
		)),
		true => Ok(AppResponse::scenario_success(
			"Обложка кампании установлена",
			None,
		)),
	}
}
