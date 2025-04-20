use ::std::{error::Error, path::Path};
use sqlx::{PgPool, postgres::PgPoolOptions};
use sqlx_core::migrate::Migrator;

use crate::config;

pub(super) async fn create_db_connection() -> Result<PgPool, Box<dyn Error>> {
	let database_url = config::get_db_config();
	let pool = PgPoolOptions::new()
		.max_connections(config::get_db_max_pool_size())
		.connect(&database_url)
		.await?;
	println!(":) Connection to the database is successful");

	let migrator = Migrator::new(Path::new("./migrations")).await?;
	migrator.run(&pool).await?;
	println!(":) Migrations finished");

	return Ok(pool);
}
