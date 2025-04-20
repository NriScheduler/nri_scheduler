use ::std::sync::LazyLock;
use derive_masked::DebugMasked;
use regex::Regex;
use serde::{Deserialize, Deserializer, de::Error as _};
use uuid::Uuid;

static EMAIL_REGEX: LazyLock<Regex> = LazyLock::new(|| {
	Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").expect("Email regex should build without errors")
});

pub(super) fn init_static() {
	let _ = *EMAIL_REGEX;
	println!("+ a email regex is ok");
}

#[derive(DebugMasked)]
pub(crate) struct RegistrationEmailDto {
	pub nickname: String,
	pub email: String,
	#[masked]
	pub password: String,
	pub timezone_offset: Option<i16>,
}

impl<'de> Deserialize<'de> for RegistrationEmailDto {
	fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
	where
		D: Deserializer<'de>,
	{
		#[derive(Deserialize)]
		struct PlainBody {
			nickname: String,
			email: String,
			password: String,
			#[serde(default)]
			timezone_offset: Option<i16>,
		}

		let PlainBody {
			nickname,
			email,
			password,
			timezone_offset,
		} = PlainBody::deserialize(deserializer)?;

		if nickname.is_empty() {
			return Err(D::Error::custom("Введено некорректное имя"));
		}
		if !EMAIL_REGEX.is_match(&email) {
			return Err(D::Error::custom("Введен некорректный email"));
		}
		if password.is_empty() {
			return Err(D::Error::custom("Введен некорректный пароль"));
		}
		if let Some(tz) = timezone_offset {
			if !(-12..=12).contains(&tz) {
				return Err(D::Error::custom("Введена некорректная временная зона"));
			}
		}

		Ok(Self {
			nickname,
			email,
			password,
			timezone_offset,
		})
	}
}

#[derive(DebugMasked)]
pub(crate) struct SignInDto {
	pub email: String,
	#[masked]
	pub password: String,
}

impl<'de> Deserialize<'de> for SignInDto {
	fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
	where
		D: Deserializer<'de>,
	{
		#[derive(Deserialize)]
		struct PlainBody {
			email: String,
			password: String,
		}

		let PlainBody { email, password } = PlainBody::deserialize(deserializer)?;

		if !EMAIL_REGEX.is_match(&email) {
			return Err(D::Error::custom("Введен некорректный email"));
		}
		if password.is_empty() {
			return Err(D::Error::custom("Введен некорректный пароль"));
		}

		Ok(Self { email, password })
	}
}

pub(crate) struct UpdateProfileDto {
	pub nickname: String,
	pub about_me: Option<String>,
	pub city: Option<String>,
	pub own_tz: Option<i16>,
	pub tz_variant: Option<String>,
}

impl<'de> Deserialize<'de> for UpdateProfileDto {
	fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
	where
		D: Deserializer<'de>,
	{
		#[derive(Deserialize)]
		struct PlainBody {
			nickname: String,
			about_me: Option<String>,
			city: Option<String>,
			own_tz: Option<i16>,
			tz_variant: Option<String>,
		}

		let PlainBody {
			nickname,
			about_me,
			city,
			mut own_tz,
			mut tz_variant,
		} = PlainBody::deserialize(deserializer)?;

		match tz_variant.as_deref() {
			Some("own") => {
				match own_tz {
					Some(ref ot) => {
						if !(-11..=12).contains(ot) {
							return Err(D::Error::custom(
								"Передано некорректное смещение временной зоны",
							));
						};
					}
					None => {
						return Err(D::Error::custom(
							"Не указано персональное смещение временной зоны",
						));
					}
				};
			}
			Some("city") | Some("device") => {
				own_tz = None;
			}
			_ => {
				own_tz = None;
				tz_variant = None
			}
		};

		Ok(Self {
			nickname,
			about_me,
			city,
			own_tz,
			tz_variant,
		})
	}
}

#[derive(Deserialize)]
pub(crate) struct VerificationDto {
	pub channel: String,
	pub code: Uuid,
}

#[derive(Debug, Deserialize)]
pub(crate) struct TelegramAuthDto {
	pub auth_date: i64,
	pub first_name: Option<String>,
	pub id: i64,
	pub last_name: Option<String>,
	pub photo_url: Option<String>,
	pub username: Option<String>,
	pub hash: String,
}
