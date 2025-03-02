pub(super) mod companies;
pub(super) mod events;
pub(super) mod locations;

#[cfg(feature = "email")]
use ::std::str::FromStr;
use ::std::sync::Arc;
use axum::{
	Extension,
	extract::State,
	response::{IntoResponse, Response},
};
#[cfg(feature = "email")]
use lettre::message::Mailbox;
use uuid::Uuid;

use crate::{
	auth,
	cookie::{remove_auth_cookie, set_auth_cookie},
	dto::{
		Dto,
		auth::{RegistrationDto, SignInDto},
	},
	repository::Repository,
	system_models::{AppError, AppResponse, AppResult},
};

pub(super) async fn registration(
	State(repo): State<Arc<Repository>>,
	Dto(body): Dto<RegistrationDto>,
) -> AppResult {
	#[cfg(feature = "email")]
	let to = Mailbox::from_str(&body.email)
		.map_err(|err| AppError::scenario_error("Введен некорректный email", Some(err)))?;

	repo
		.registration(
			&body.nickname,
			&body.email,
			&body.password,
			body.timezone_offset,
		)
		.await?;

	#[cfg(feature = "email")]
	crate::email::send(to).await.map_err(|err| {
		AppError::scenario_error(
			"Не удалось отправить сообщение для подтверждения email",
			Some(err),
		)
	})?;

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

pub(super) async fn read_profile(
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
