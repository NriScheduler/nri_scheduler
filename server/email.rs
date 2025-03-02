use ::std::{
	error::Error as StdError,
	fmt::{Display, Formatter, Result as FmtResult},
	str::FromStr,
	sync::LazyLock,
};
use lettre::{
	Message, SmtpTransport, Transport,
	error::Error as EmailError,
	message::{Mailbox, header::ContentType},
	transport::smtp::{Error as TransportError, authentication::Credentials},
};
use tokio::task::{self, JoinError};

static SMTP_LOGIN: LazyLock<String> = LazyLock::new(|| {
	::std::env::var("SMTP_LOGIN").expect("SMTP_LOGIN environment variable is not defined")
});
static SMTP_PASS: LazyLock<String> = LazyLock::new(|| {
	::std::env::var("SMTP_PASS").expect("SMTP_PASS environment variable is not defined")
});
static FROM_MAIL_BOX: LazyLock<Mailbox> = LazyLock::new(|| {
	let login = format!("NriScheduler <{}>", *SMTP_LOGIN);
	Mailbox::from_str(&login)
		.expect("SMTP_LOGIN environment variable contains invalid email address")
});

pub(super) fn init_static() {
	let _ = *FROM_MAIL_BOX;
	let _ = *SMTP_PASS;
	println!("+ smtp static values are ok");
}

pub(super) async fn send(to: Mailbox) -> Result<(), SendMailError> {
	task::spawn_blocking(|| send_sync(to)).await?
}

fn send_sync(to: Mailbox) -> Result<(), SendMailError> {
	let email = Message::builder()
		.from(FROM_MAIL_BOX.clone())
		.to(to)
		.subject("Регистрация в сервисе NriScheduler. Подтверждение адреса электронной почты.")
		.header(ContentType::TEXT_PLAIN)
		.body(String::from("Be happy!"))?;

	let creds = Credentials::new(SMTP_LOGIN.clone(), SMTP_PASS.clone());

	let mailer = SmtpTransport::relay("smtp.mail.ru")?
		.credentials(creds)
		.build();

	mailer.send(&email)?;

	Ok(())
}

#[derive(Debug)]
pub(super) enum SendMailError {
	Email(EmailError),
	Transport(TransportError),
	Task(JoinError),
}

impl Display for SendMailError {
	fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
		match self {
			Self::Email(err) => err.fmt(f),
			Self::Transport(err) => err.fmt(f),
			Self::Task(err) => err.fmt(f),
		}
	}
}

impl StdError for SendMailError {}

impl From<EmailError> for SendMailError {
	fn from(err: EmailError) -> Self {
		Self::Email(err)
	}
}

impl From<TransportError> for SendMailError {
	fn from(err: TransportError) -> Self {
		Self::Transport(err)
	}
}

impl From<JoinError> for SendMailError {
	fn from(err: JoinError) -> Self {
		Self::Task(err)
	}
}
