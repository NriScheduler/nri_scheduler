use std::{
	fs::read_to_string as read_file_to_string,
	sync::LazyLock,
	time::{Duration, SystemTime, UNIX_EPOCH},
};

use argon2::{
	Argon2,
	password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use axum::{
	body::Body,
	http::Request,
	middleware::Next,
	response::{IntoResponse, Response},
};
use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::{
	Algorithm::ES256, DecodingKey, EncodingKey, Header as JwtHeader, TokenData, Validation,
	decode as decode_and_verify, encode,
};
use rand::Rng;
use serde::{Deserialize, Serialize};
use tokio::time::sleep;
use uuid::Uuid;

use crate::{
	cookie::{extract_jwt_from_cookie, remove_auth_cookie},
	system_models::{AppError, AppResponse, CoreResult},
};

pub(super) const SESSION_LIFETIME: u64 = 3600; // 1 час в секундах

// default params
// alg: argon2id
// version: 19
// params: m=19456,t=2,p=1
// prefix: $argon2id$v=19$m=19456,t=2,p=1$ (len 31, salt+delimiter+hash len 66)
// $argon2id$v=19$m=19456,t=2,p=1$goAxCzRvjpKz3c2yj1xIdQ$j39vSFfn0rSE67hsPJ58qz3TdvEr1kzFLUf8oIL7g0E
// pref.len = 31
// suf.len = 66
static ARGON: LazyLock<Argon2<'static>> = LazyLock::new(Argon2::default);

static PRIVATE_KEY: LazyLock<EncodingKey> = LazyLock::new(|| {
	EncodingKey::from_ec_pem(
		read_file_to_string("private_key.pem")
			.expect("can't read a private key")
			.as_bytes(),
	)
	.expect("can't parse private key")
});

static PUBLIC_KEY: LazyLock<DecodingKey> = LazyLock::new(|| {
	DecodingKey::from_ec_pem(
		read_file_to_string("public_key.pem")
			.expect("can't read a public key")
			.as_bytes(),
	)
	.expect("can't parse a public key")
});

static JWT_HEADER: LazyLock<JwtHeader> = LazyLock::new(|| JwtHeader::new(ES256));
static JWT_VALIDATION: LazyLock<Validation> = LazyLock::new(|| Validation::new(ES256));

#[derive(Debug, Deserialize, Serialize)]
struct Claims {
	sub: Uuid,
	exp: u64,
	verified: bool,
}

pub(super) fn hash_password(password: &str) -> CoreResult<String> {
	let salt = SaltString::generate(&mut OsRng);
	let password_hash = ARGON
		.hash_password(password.as_bytes(), &salt)
		.map_err(|e| {
			eprintln!("Ошибка хэширования пароля: {e}");
			AppError::ScenarioError(String::from("Ошибка хэширования пароля"), None)
		})?;

	let suffix = &password_hash.to_string()[31..];
	Ok(suffix.to_string())
}

pub(super) async fn verify_password(password: &str, password_hash: String) -> CoreResult {
	let full_hash = format!("$argon2id$v=19$m=19456,t=2,p=1${password_hash}");
	let parsed_hash = PasswordHash::new(&full_hash).map_err(|e| {
		eprintln!("Ошибка парсига пароля: {e}");
		AppError::system_error("Ошибка парсига пароля")
	})?;

	ARGON
		.verify_password(password.as_bytes(), &parsed_hash)
		.map_err(|e| {
			println!("Неверный пароль: {e}");
			AppError::unauthorized("Неверный пароль")
		})?;

	let random_millis: u64 = rand::rng().random_range(1..=50);
	sleep(Duration::from_millis(random_millis)).await;

	Ok(())
}

pub(super) async fn auth_middleware(
	cookie_jar: CookieJar,
	mut req: Request<Body>,
	next: Next,
) -> Response {
	let Some(jwt) = extract_jwt_from_cookie(&cookie_jar) else {
		return AppError::unauthorized("Необходима авторизация").into_response();
	};

	let Ok(TokenData { claims, .. }) =
		decode_and_verify::<Claims>(jwt, &PUBLIC_KEY, &JWT_VALIDATION)
	else {
		return AppError::unauthorized("Неверный пароль").into_response();
	};

	let Ok(now) = SystemTime::now()
		.duration_since(UNIX_EPOCH)
		.map(|dur| dur.as_secs())
	else {
		return AppResponse::system_error("Time went backwards", None).into_response();
	};

	if now >= claims.exp {
		return AppError::SessionExpired.into_response();
	}

	req.extensions_mut().insert(claims.sub);

	next.run(req).await
}

pub(super) async fn auth_and_verified_middleware(
	cookie_jar: CookieJar,
	mut req: Request<Body>,
	next: Next,
) -> Response {
	let Some(jwt) = extract_jwt_from_cookie(&cookie_jar) else {
		return AppError::unauthorized("Необходима авторизация").into_response();
	};

	let Ok(TokenData { claims, .. }) =
		decode_and_verify::<Claims>(jwt, &PUBLIC_KEY, &JWT_VALIDATION)
	else {
		return AppError::unauthorized("Неверный пароль").into_response();
	};

	let Ok(now) = SystemTime::now()
		.duration_since(UNIX_EPOCH)
		.map(|dur| dur.as_secs())
	else {
		return AppResponse::system_error("Time went backwards", None).into_response();
	};

	if now >= claims.exp {
		return AppError::SessionExpired.into_response();
	}

	if !claims.verified {
		return AppError::unauthorized("Контактная информация не подтверждена").into_response();
	}

	req.extensions_mut().insert(claims.sub);

	next.run(req).await
}

pub(super) async fn optional_auth_middleware(
	cookie_jar: CookieJar,
	mut req: Request<Body>,
	next: Next,
) -> Response {
	let Some(jwt) = extract_jwt_from_cookie(&cookie_jar) else {
		req.extensions_mut().insert(None::<Uuid>);

		return next.run(req).await;
	};

	let Ok(TokenData { claims, .. }) =
		decode_and_verify::<Claims>(jwt, &PUBLIC_KEY, &JWT_VALIDATION)
	else {
		return handle_invalid_jwt_for_optional_auth(req, next).await;
	};

	let Ok(now) = SystemTime::now()
		.duration_since(UNIX_EPOCH)
		.map(|dur| dur.as_secs())
	else {
		return AppResponse::system_error("Time went backwards", None).into_response();
	};

	if now >= claims.exp {
		return handle_invalid_jwt_for_optional_auth(req, next).await;
	}

	req.extensions_mut().insert(Some(claims.sub));

	next.run(req).await
}

async fn handle_invalid_jwt_for_optional_auth(mut req: Request<Body>, next: Next) -> Response {
	req.extensions_mut().insert(None::<Uuid>);
	let mut res = next.run(req).await;

	match remove_auth_cookie(&mut res) {
		Ok(()) => res,
		Err(err) => err.into_response(),
	}
}

pub(super) fn generate_jwt(user_id: Uuid, verified: bool) -> CoreResult<String> {
	// Время истечения срока действия токена (текущее время + время жизни сессии)
	let expiration_time = SystemTime::now()
		.duration_since(UNIX_EPOCH)
		.map_err(|_| AppError::system_error("Time went backwards"))?
		.as_secs()
		+ SESSION_LIFETIME;

	let claims = Claims {
		sub: user_id,
		exp: expiration_time,
		verified,
	};

	let token = encode(&JWT_HEADER, &claims, &PRIVATE_KEY).map_err(|e| {
		println!("Ошибка формирования JWT: {e}");
		AppError::system_error("Ошибка формирования JWT")
	})?;

	Ok(token)
}

pub(super) fn init_static() {
	let _ = *PRIVATE_KEY;
	println!("+ a private key is ok");

	let _ = *PUBLIC_KEY;
	println!("+ a public key is ok");

	let _ = *ARGON;
	let _ = *JWT_HEADER;
	let _ = *JWT_VALIDATION;
}
