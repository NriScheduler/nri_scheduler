use ::std::sync::LazyLock;
use chrono::Utc;
use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256};

use crate::{dto::auth::TelegramAuthDto, shared::prevent_timing_attack};

static TG_BOT_SECRET_KEY: LazyLock<[u8; 32]> = LazyLock::new(|| {
	let bot_token =
		::std::env::var("TG_BOT_TOKEN").expect("TG_BOT_TOKEN environment variable is not defined");

	let mut hasher = Sha256::new();
	hasher.update(bot_token.as_bytes());

	let secret_key: [u8; 32] = hasher.finalize().into();

	let _ = Hmac::<Sha256>::new_from_slice(&secret_key)
		.expect("Incorrect TG_BOT_TOKEN value - can't create a Hmac");

	secret_key
});

pub(super) fn init_static() {
	let _ = *TG_BOT_SECRET_KEY;
	println!("+ telegram static values are ok");
}

pub(crate) async fn verify_telegram_hash(data: &TelegramAuthDto) -> bool {
	prevent_timing_attack().await;

	let now = Utc::now().timestamp();
	// 1. Проверяем что авторизационные данные получены не позднее 5 минут
	if (now - data.auth_date) > 300 {
		return false;
	}

	// 2. Собираем данные для проверки
	let data_check_string = format!(
		"auth_date={}\nfirst_name={}\nid={}\nlast_name={}\nphoto_url={}\nusername={}",
		data.auth_date,
		data.first_name.as_deref().unwrap_or_default(),
		data.id,
		data.last_name.as_deref().unwrap_or_default(),
		data.photo_url.as_deref().unwrap_or_default(),
		data.username.as_deref().unwrap_or_default(),
	);

	// 3. Вычисляем хэш
	let Ok(mut mac) = Hmac::<Sha256>::new_from_slice(&*TG_BOT_SECRET_KEY) else {
		// недостижимая ветка т.к. проверили при инициализации TG_BOT_SECRET_KEY
		return false;
	};
	mac.update(data_check_string.as_bytes());
	let computed_hash = hex::encode(mac.finalize().into_bytes());

	// 4. Сравниваем хэши
	computed_hash == data.hash
}
