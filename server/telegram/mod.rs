use ::std::{collections::BTreeMap, error::Error, sync::LazyLock};
use chrono::Utc;
use hmac::{Hmac, Mac};
use sha2::Sha256;

use crate::dto::auth::TelegramAuthDto;

static TG_BOT_SECRET_KEY: LazyLock<[u8; 32]> = LazyLock::new(|| {
	let bot_token =
		::std::env::var("TG_BOT_TOKEN").expect("TG_BOT_TOKEN environment variable is not defined");

	let mut mac = Hmac::<Sha256>::new_from_slice(b"WebAppData").expect("can't parse a salt");
	mac.update(bot_token.as_bytes());
	mac.finalize().into_bytes().into()
});

pub(super) fn init_static() {
	let _ = *TG_BOT_SECRET_KEY;
	println!("+ telegram static values are ok");
}

pub(crate) fn verify_telegram_hash(data: &TelegramAuthDto) -> Result<bool, Box<dyn Error>> {
	let now = Utc::now().timestamp();
	// 1. Проверяем что авторизационные данные получены не позднее 24 часов
	if (now - data.auth_date) > 86400 {
		return Err("Данные авторизации устарели".into());
	}

	// 2. Собираем данные для проверки
	let mut data_check = BTreeMap::new();
	data_check.insert("auth_date", data.auth_date.to_string());
	if let Some(ref first_name) = data.first_name {
		data_check.insert("first_name", first_name.clone());
	}
	data_check.insert("id", data.id.to_string());
	if let Some(ref last_name) = data.last_name {
		data_check.insert("last_name", last_name.clone());
	}
	if let Some(ref photo_url) = data.photo_url {
		data_check.insert("photo_url", photo_url.clone());
	}
	if let Some(ref username) = data.username {
		data_check.insert("username", username.clone());
	}

	// 3. Формируем строку для проверки
	let data_check_string = data_check
		.iter()
		.map(|(k, v)| format!("{k}={v}"))
		.collect::<Vec<_>>()
		.join("\n");

	// 4. Вычисляем хэш
	let mut mac = Hmac::<Sha256>::new_from_slice(&*TG_BOT_SECRET_KEY)?;
	mac.update(data_check_string.as_bytes());
	let computed_hash = hex::encode(mac.finalize().into_bytes());

	// 5. Сравниваем хэши
	Ok(computed_hash == data.hash)
}
