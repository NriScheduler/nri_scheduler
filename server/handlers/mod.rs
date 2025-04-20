pub(super) mod apps;
pub(super) mod companies;
pub(super) mod events;
pub(super) mod locations;
pub(super) mod regions;
pub(super) mod verify;

use ::std::{str::FromStr as _, sync::Arc};
use axum::{
	Extension,
	extract::{Path, State},
	response::{IntoResponse, Response},
};
use lettre::message::Mailbox;
use tokio::task;
use uuid::Uuid;

use crate::{
	auth,
	cookie::{remove_auth_cookie, set_auth_cookie},
	dto::{
		Dto, FileLinkDto,
		auth::{RegistrationEmailDto, SignInDto, TelegramAuthDto, UpdateProfileDto},
	},
	image,
	repository::Repository,
	system_models::{AppError, AppResponse, AppResult},
	telegram::verify_telegram_hash,
};

pub(super) async fn registration_email(
	State(repo): State<Arc<Repository>>,
	Dto(body): Dto<RegistrationEmailDto>,
) -> AppResult {
	let to = Mailbox::from_str(&body.email)
		.map_err(|err| AppError::scenario_error("Введен некорректный email", Some(err)))?;

	let verification_id = repo
		.registration(
			&body.nickname,
			&body.email,
			&body.password,
			body.timezone_offset,
		)
		.await?;

	task::spawn(crate::email::send(to, verification_id));

	return AppResponse::user_registered();
}

pub(super) async fn sign_in_email(
	State(repo): State<Arc<Repository>>,
	Dto(body): Dto<SignInDto>,
) -> Response {
	let user = match repo.get_user_for_signing_in_email(&body.email).await {
		Ok(Some(user)) => user,
		Ok(None) => return AppError::unauthorized("Неверный пароль").into_response(),
		Err(err) => return err.into_response(),
	};

	let Some(pw_hash) = user.pw_hash else {
		return AppError::unauthorized("Неверный пароль").into_response();
	};

	if auth::verify_password(&body.password, pw_hash)
		.await
		.is_err()
	{
		return AppError::unauthorized("Неверный пароль").into_response();
	};

	let jwt = match auth::generate_jwt(user.id, user.verified) {
		Err(err) => return err.into_response(),
		Ok(jwt) => jwt,
	};

	let mut res = AppResponse::scenario_success("Успешная авторизация", None).into_response();

	match set_auth_cookie(&mut res, &jwt) {
		Ok(()) => res,
		Err(err) => err.into_response(),
	}
}

pub(super) async fn sign_in_tg(
	State(repo): State<Arc<Repository>>,
	Dto(body): Dto<TelegramAuthDto>,
) -> Response {
	if !verify_telegram_hash(&body).await {
		return AppError::scenario_error("Некорректные авторизационные данные", None::<&str>)
			.into_response();
	}

	let user_id = match repo.get_user_for_signing_in_tg(body.id).await {
		Err(err) => return err.into_response(),
		Ok(Some(u)) => u,
		Ok(None) => match registration_tg(repo, body).await {
			Err(err) => return err.into_response(),
			Ok(u) => u,
		},
	};

	let jwt = match auth::generate_jwt(user_id, true) {
		Err(err) => return err.into_response(),
		Ok(jwt) => jwt,
	};

	let mut res = AppResponse::scenario_success("Успешная авторизация", None).into_response();

	match set_auth_cookie(&mut res, &jwt) {
		Ok(()) => res,
		Err(err) => err.into_response(),
	}
}

async fn registration_tg(repo: Arc<Repository>, body: TelegramAuthDto) -> Result<Uuid, AppError> {
	let nickname = body.username.unwrap_or_else(|| {
		body
			.first_name
			.unwrap_or_else(|| format!("user_{}", body.id))
	});

	repo.registration_tg(&nickname, body.id).await
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

pub(super) async fn read_avatar(
	State(repo): State<Arc<Repository>>,
	Path(profile_id): Path<Uuid>,
) -> Response {
	image::serve(repo.get_avatar_link(profile_id)).await
}

pub(super) async fn set_avatar(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Uuid>,
	Dto(body): Dto<FileLinkDto>,
) -> AppResult {
	image::check_remote_file(&body.url).await?;
	repo.set_avatar(user_id, &body.url).await?;

	Ok(AppResponse::scenario_success("Установлен аватар", None))
}
