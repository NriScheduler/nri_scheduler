use ::std::{error::Error, sync::LazyLock};
use axum::{
	Form, Json, RequestExt,
	extract::{
		FromRequest, Request,
		rejection::{FormRejection, JsonRejection},
	},
	http::{HeaderValue, Method, header},
};
use serde::de::DeserializeOwned;

use crate::system_models::AppError;

static URL_ENCODED: LazyLock<HeaderValue> = LazyLock::new(|| {
	HeaderValue::from_str("application/x-www-form-urlencoded")
		.expect("can't parse an urlencoded header value")
});

pub(super) fn init_static() {
	let _ = *URL_ENCODED;
	println!("+ an urlencoded header value is ok");
}

pub(crate) struct Dto<T>(pub(crate) T);

impl<T, S> FromRequest<S> for Dto<T>
where
	T: 'static + DeserializeOwned,
	S: Send + Sync,
{
	type Rejection = AppError;

	async fn from_request(req: Request, _: &S) -> Result<Self, Self::Rejection> {
		if req.method() == Method::GET {
			let query = req.uri().query().unwrap_or_default();
			let params = serde_urlencoded::from_str::<'_, T>(query);
			params.map(Dto).map_err(|err| {
				AppError::scenario_error("Переданы некорректные параметры запроса", Some(err))
			})
		} else {
			if let Some(content_type) = req.headers().get(header::CONTENT_TYPE) {
				if content_type == URL_ENCODED.as_ref() {
					let body = req.extract::<Form<T>, _>().await;
					return body
						.map(|Form(dto)| Dto(dto))
						.map_err(handle_form_rejection);
				}
			}

			let body = req.extract::<Json<T>, _>().await;
			body
				.map(|Json(dto)| Dto(dto))
				.map_err(handle_json_rejection)
		}
	}
}

fn handle_json_rejection(err: JsonRejection) -> AppError {
	return match err {
		JsonRejection::JsonDataError(data_err) => match data_err.source() {
			Some(source_err) => AppError::ScenarioError(
				format!("Передано некорректное тело запроса: {source_err}"),
				None,
			),
			None => AppError::ScenarioError("Передано некорректное тело запроса".into(), None),
		},

		JsonRejection::JsonSyntaxError(_) => {
			AppError::ScenarioError("Передано некорректное тело запроса".into(), None)
		}

		JsonRejection::MissingJsonContentType(_) => AppError::ScenarioError(
			String::from("Пожалуйста, укажите заголовок `Content-Type: application/json`"),
			None,
		),

		JsonRejection::BytesRejection(_) => {
			AppError::system_error("Не удалось прочитать тело запроса")
		}

		non_exhaustive => AppError::system_error(non_exhaustive),
	};
}

fn handle_form_rejection(err: FormRejection) -> AppError {
	return match err {
		FormRejection::InvalidFormContentType(_) => AppError::ScenarioError(
			String::from(
				"Пожалуйста, укажите заголовок `Content-Type: application/x-www-form-urlencoded`",
			),
			None,
		),

		FormRejection::FailedToDeserializeForm(data_err) => match data_err.source() {
			Some(source_err) => AppError::ScenarioError(
				format!("Передано некорректное тело запроса: {source_err}"),
				None,
			),
			None => AppError::ScenarioError("Передано некорректное тело запроса".into(), None),
		},

		FormRejection::FailedToDeserializeFormBody(data_err) => match data_err.source() {
			Some(source_err) => AppError::ScenarioError(
				format!("Передано некорректное тело запроса: {source_err}"),
				None,
			),
			None => AppError::ScenarioError("Передано некорректное тело запроса".into(), None),
		},

		FormRejection::BytesRejection(data_err) => {
			AppError::system_error(format!("Не удалось прочитать тело запроса {data_err}"))
		}

		non_exhaustive => AppError::system_error(non_exhaustive),
	};
}
