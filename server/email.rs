use ::std::{str::FromStr as _, sync::LazyLock};
use lettre::{
	Message, SmtpTransport, Transport,
	message::{Mailbox, header::ContentType},
	transport::smtp::authentication::Credentials,
};
use tokio::task;
use uuid::Uuid;

use crate::system_models::{AppError, CoreResult};

static EXTERNAL_HOST: LazyLock<String> = LazyLock::new(|| {
	::std::env::var("EXTERNAL_HOST").expect("EXTERNAL_HOST environment variable is not defined")
});
static SMTP_RELAY: LazyLock<String> = LazyLock::new(|| {
	::std::env::var("SMTP_RELAY").expect("SMTP_RELAY environment variable is not defined")
});
static FROM_MAIL_BOX: LazyLock<Mailbox> = LazyLock::new(|| {
	let smtp_login =
		::std::env::var("SMTP_LOGIN").expect("SMTP_LOGIN environment variable is not defined");

	let login = format!("NriScheduler <{smtp_login}>");

	Mailbox::from_str(&login)
		.expect("SMTP_LOGIN environment variable contains invalid email address")
});
static MAILER: LazyLock<SmtpTransport> = LazyLock::new(|| {
	let smtp_login =
		::std::env::var("SMTP_LOGIN").expect("SMTP_LOGIN environment variable is not defined");
	let smtp_pass =
		::std::env::var("SMTP_PASS").expect("SMTP_PASS environment variable is not defined");

	let creds = Credentials::new(smtp_login, smtp_pass);

	SmtpTransport::relay(&SMTP_RELAY)
		.expect("Failed to create SmtpTransport")
		.credentials(creds)
		.build()
});

pub(super) fn init_static() {
	let _ = *EXTERNAL_HOST;
	let _ = *FROM_MAIL_BOX;
	let _ = *MAILER;
	println!("+ smtp static values are ok");
}

pub(super) async fn send(to: Mailbox, verification_code: Uuid) -> CoreResult {
	task::spawn_blocking(move || send_sync(to, verification_code))
		.await
		.map_err(AppError::system_error)?
}

fn send_sync(to: Mailbox, verification_code: Uuid) -> CoreResult {
	let email = Message::builder()
		.from(FROM_MAIL_BOX.clone())
		.to(to)
		.subject("Подтверждение адреса электронной почты")
		.header(ContentType::TEXT_HTML)
		.body(format!(
			r#"Вы получили это письмо, потому что зарегистрировались в сервисе NriScheduler.<br><br>
Для подтверждения адреса электронной почты, перейдите по <a href="{}/verification?channel=email&code={verification_code}">ссылке</a>."#, *EXTERNAL_HOST
		))
		.map_err(AppError::system_error)?;

	MAILER.send(&email).map_err(AppError::system_error)?;

	Ok(())
}
