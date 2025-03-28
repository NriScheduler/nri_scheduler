use ::std::{str::FromStr as _, sync::Arc};
use axum::extract::{Extension, State};
use lettre::message::Mailbox;
use uuid::Uuid;

use crate::{
	dto::{Dto, auth::VerificationDto},
	repository::Repository,
	system_models::{AppError, AppResponse, AppResult},
};

pub(crate) async fn verify(
	State(repo): State<Arc<Repository>>,
	Dto(body): Dto<VerificationDto>,
) -> AppResult {
	match body.channel.as_ref() {
		"email" => verify_email(repo, body.code).await,
		_ => AppError::scenario_error("Неподдерживаемый тип канала верификации", None::<&str>).into(),
	}
}

pub(crate) async fn send_email_verification(
	State(repo): State<Arc<Repository>>,
	Extension(user_id): Extension<Uuid>,
) -> AppResult {
	let (verification_id, email) = repo.send_email_verification(user_id).await?;

	let to = Mailbox::from_str(&email)
		.map_err(|_| AppError::system_error("Некорректный email пользователя"))?;

	crate::email::send(to, verification_id)
		.await
		.map_err(|err| {
			AppError::scenario_error(
				"Не удалось отправить сообщение для подтверждения email",
				Some(err),
			)
		})?;

	Ok(AppResponse::scenario_success(
		"Отправлено новое письмо для подтверждения электронной почты",
		None,
	))
}

async fn verify_email(repo: Arc<Repository>, code: Uuid) -> AppResult {
	let Some((expired, was_updated)) = repo.verify_email(code).await? else {
		return AppError::scenario_error("Неверная ссылка для верификации", None::<&str>).into();
	};

	if expired {
		return AppError::scenario_error("Ссылка для верификации просрочена", None::<&str>).into();
	}

	if !was_updated {
		return Err(AppError::scenario_error(
			"Электронная почта уже была подтверждена",
			None::<&str>,
		));
	}

	Ok(AppResponse::scenario_success(
		"Адрес электронной почты успешно подтверждён",
		None,
	))
}
