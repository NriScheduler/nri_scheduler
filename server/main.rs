use ::std::{error::Error, sync::Arc};
#[cfg(feature = "https")]
use axum_server::{Handle, tls_rustls::RustlsConfig};
use nri_scheduler::{config, graceful_shutdown::shutdown_signal, repository::Repository, router};
#[cfg(not(feature = "https"))]
use tokio::net::TcpListener as AsyncTcpListener;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
	config::init_static();

	let repo = Repository::new().await?;
	let repo = Arc::new(repo);
	let app = router::create_router(repo.clone());

	let addr = config::get_http_host_to_serve();

	#[cfg(feature = "https")]
	{
		let config = RustlsConfig::from_pem_file("cert.pem", "key.pem").await?;

		println!(":) Certs parsed");

		let handle = Handle::new();

		tokio::spawn(shutdown_signal(repo, handle.clone()));

		axum_server::bind_rustls(addr, config)
			.handle(handle)
			.serve(app.into_make_service())
			.await?
	}

	#[cfg(not(feature = "https"))]
	{
		let listener = AsyncTcpListener::bind(addr).await?;

		println!(":) Server started successfully");

		axum::serve(listener, app)
			.with_graceful_shutdown(shutdown_signal(repo))
			.await?;
	}

	Ok(())
}
