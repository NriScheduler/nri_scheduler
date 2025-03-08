pub(super) mod companies;
pub(super) mod events;
pub(super) mod locations;

use ::std::sync::Arc;
use axum::{
	Extension,
	extract::{Path, State},
	http::StatusCode,
	response::{IntoResponse, Response},
};
use uuid::Uuid;

use crate::{
	auth, avatar,
	cookie::{remove_auth_cookie, set_auth_cookie},
	dto::{
		Dto,
		auth::{RegistrationDto, SetAvatarDto, SignInDto, UpdateProfileDto},
	},
	repository::Repository,
	system_models::{AppError, AppResponse, AppResult},
};

pub(super) async fn registration(
	State(repo): State<Arc<Repository>>,
	Dto(body): Dto<RegistrationDto>,
) -> AppResult {
	repo
		.registration(
			&body.nickname,
			&body.email,
			&body.password,
			body.timezone_offset,
		)
		.await?;

	return AppResponse::user_registered();
}

pub(super) async fn sign_in(
	State(repo): State<Arc<Repository>>,
	Dto(body): Dto<SignInDto>,
) -> Response {
	let user = match repo.get_user_for_signing_in(&body.email).await {
		Ok(Some(user)) => user,
		Ok(None) => return AppError::unauthorized("Неверный пароль").into_response(),
		Err(err) => return err.into_response(),
	};

	if auth::verify_password(&body.password, user.pw_hash)
		.await
		.is_err()
	{
		return AppError::unauthorized("Неверный пароль").into_response();
	};

	let jwt = match auth::generate_jwt(user.id) {
		Err(err) => return err.into_response(),
		Ok(jwt) => jwt,
	};

	let mut res = AppResponse::scenario_success("Успешная авторизация", None).into_response();

	match set_auth_cookie(&mut res, &jwt) {
		Ok(()) => res,
		Err(err) => err.into_response(),
	}
}

pub(super) async fn logout() -> Response {
	let mut res = AppResponse::scenario_success("Сессия завершена", None).into_response();

	match remove_auth_cookie(&mut res) {
		Ok(()) => res,
		Err(err) => err.into_response(),
	}
}

pub(super) async fn read_my_profile(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Uuid>,
) -> AppResult {
	let profile = repo.read_profile(user_id).await?;

	Ok(match profile {
		None => AppResponse::scenario_fail("Пользователь не найден", None),
		Some(profile) => {
			let payload = serde_json::to_value(profile)?;
			AppResponse::scenario_success("Профиль получен", Some(payload))
		}
	})
}

pub(super) async fn update_my_profile(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Uuid>,
	Dto(body): Dto<UpdateProfileDto>,
) -> AppResult {
	repo.update_profile(user_id, body).await?;

	Ok(AppResponse::scenario_success(
		"Данные пользователя обновлены",
		None,
	))
}

pub(super) async fn read_another_profile(
	State(repo): State<Arc<Repository>>,
	Extension(_user_id): Extension<Option<Uuid>>, // когда-нибудь пригодится для определения показывать ли контакты
	Path(profile_id): Path<Uuid>,
) -> AppResult {
	let profile = repo.read_profile(profile_id).await?;

	Ok(match profile {
		None => AppResponse::scenario_fail("Пользователь не найден", None),
		Some(profile) => {
			let payload = serde_json::to_value(profile)?;
			AppResponse::scenario_success("Профиль получен", Some(payload))
		}
	})
}

pub(super) async fn who_i_am(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Uuid>,
) -> AppResult {
	let self_info = repo.who_i_am(user_id).await?;

	Ok(match self_info {
		None => AppResponse::system_error("Какая-то ерунда, не смогли найти пользователя", None),
		Some(self_info) => {
			let payload = serde_json::to_value(self_info)?;
			AppResponse::scenario_success("I know who I am", Some(payload))
		}
	})
}

pub(super) async fn read_avatar(
	State(repo): State<Arc<Repository>>,
	Path(profile_id): Path<Uuid>,
) -> Response {
	match repo.get_avatar_link(profile_id).await {
		Err(err) => err.into_response(),
		Ok(maybe_link) => match maybe_link {
			None => StatusCode::NOT_FOUND.into_response(),
			Some(link) => avatar::proxy(&link)
				.await
				.unwrap_or_else(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()),
		},
	}
}

pub(super) async fn set_avatar(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Uuid>,
	Dto(body): Dto<SetAvatarDto>,
) -> AppResult {
	let is_image = avatar::check_remote_file(&body.url).await.map_err(|e| {
		eprintln!("Ошибка проверки аватара: {e}");
		AppError::system_error("Ошибка проверки аватара")
	})?;

	if !is_image {
		return Err(AppError::system_error(
			"Переданная ссылка не является ссылкой на файл изображения",
		));
	}

	repo.set_avatar(user_id, &body.url).await?;

	Ok(AppResponse::scenario_success("Установлен аватар", None))
}
