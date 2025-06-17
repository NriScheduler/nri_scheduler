use ::std::{error::Error, sync::Arc};
use axum::{Router as AxumRouter, middleware};
#[cfg(feature = "cors")]
use axum::{http::StatusCode, routing::options};
use okapi_operation::axum_integration::{Router as OkapiRouter, get, post, put};
#[cfg(feature = "static")]
use tower_http::services::{ServeDir, ServeFile};
use utoipa::openapi::OpenApi as UtoipaSpec;
use utoipa_swagger_ui::SwaggerUi;

#[cfg(feature = "cors")]
use crate::cors;
#[cfg(feature = "vite")]
use crate::vite::proxy_to_vite;
use crate::{auth, handlers as H, state::AppState};

pub fn create_router(state: Arc<AppState>) -> Result<AxumRouter, Box<dyn Error>> {
	let okapi_router = OkapiRouter::new()
		.route("/avatar/{id}", get(H::read_avatar))
		.route("/cover/{id}", get(H::companies::read_company_cover))
		.nest(
			"/api",
			OkapiRouter::new()
				.route("/registration", post(H::registration_email))
				.route("/signin", post(H::sign_in_email))
				.route("/signin/tg", post(H::sign_in_tg))
				.route("/logout", post(H::logout))
				.route("/verify", post(H::verify::verify))
				.route("/locations", get(H::locations::get_locations_list))
				.route("/locations/{id}", get(H::locations::get_location_by_id))
				.route("/regions", get(H::regions::read_regions_list))
				.route("/cities", get(H::regions::read_cities_list))
				.merge(
					OkapiRouter::new()
						.route("/sse", get(H::sse::sse_handler))
						.route("/profile/{id}", get(H::read_another_profile))
						.route("/companies/{id}", get(H::companies::get_company_by_id))
						.route("/events", get(H::events::read_events_list))
						.route("/events/{id}", get(H::events::read_event))
						.layer(middleware::from_fn(auth::optional_auth_middleware)),
				)
				.merge(
					OkapiRouter::new()
						.route(
							"/profile/my",
							get(H::read_my_profile).put(H::update_my_profile),
						)
						.route(
							"/profile/send-email-verification",
							post(H::verify::send_email_verification),
						)
						.route("/touches-history", get(H::read_touches_history))
						.layer(middleware::from_fn(auth::auth_middleware)),
				)
				.merge(
					OkapiRouter::new()
						.route("/tg-avatar", get(H::tg_avatar))
						.route("/profile/avatar", put(H::set_avatar))
						.route("/locations", post(H::locations::add_location))
						.route("/companies", post(H::companies::add_company))
						.route("/companies/my", get(H::companies::get_my_companies))
						.route("/companies/{id}", put(H::companies::update_company))
						.route("/companies/{id}/cover", put(H::companies::set_cover))
						.route("/events", post(H::events::add_event))
						.route("/events/apply/{id}", post(H::events::apply_event))
						.route("/events/cancel/{id}", post(H::events::cancel_event))
						.route("/events/reopen/{id}", post(H::events::reopen_event))
						.route("/events/{id}", put(H::events::update_event))
						.route("/apps", get(H::apps::read_player_apps_list))
						.route("/apps/{id}", get(H::apps::read_player_app))
						.route(
							"/apps/by_event/{id}",
							get(H::apps::read_player_app_by_event),
						)
						.route(
							"/apps/company_closest/{id}",
							get(H::apps::read_player_app_company_closest),
						)
						.route("/apps/master", get(H::apps::read_master_apps_list))
						.route(
							"/apps/master/by_event/{id}",
							get(H::apps::read_master_apps_list_by_event),
						)
						.route(
							"/apps/master/company_closest/{id}",
							get(H::apps::read_master_apps_list_company_closest),
						)
						.route("/apps/master/{id}", get(H::apps::read_master_app))
						.route("/apps/approve/{id}", post(H::apps::approve_app))
						.route("/apps/reject/{id}", post(H::apps::reject_app))
						.route("/regions", post(H::regions::add_region))
						.route("/cities", post(H::regions::add_city))
						.layer(middleware::from_fn(auth::auth_and_verified_middleware)),
				),
		)
		.with_state(state);

	let spec = generate_spec(&okapi_router)?;

	let router = okapi_router.axum_router();

	#[cfg(feature = "vite")]
	let router = router.fallback(proxy_to_vite);

	#[cfg(feature = "cors")]
	let router = router
		.route("/{*any}", options(|| async { StatusCode::NO_CONTENT }))
		.layer(middleware::from_fn(cors::cors_middleware));

	let router = router.merge(SwaggerUi::new("/swagger").url("/swagger.json", spec));

	#[cfg(feature = "static")]
	let router = router
		.nest_service("/assets", ServeDir::new("static/assets"))
		.fallback_service(ServeFile::new("static/index.html"));

	return Ok(router);
}

fn generate_spec(okapi_router: &OkapiRouter) -> Result<UtoipaSpec, Box<dyn Error>> {
	let mut okapi_spec = okapi_router
		.generate_openapi_builder()
		.title(env!("CARGO_PKG_NAME"))
		.version(env!("CARGO_PKG_VERSION"))
		.build()?;
	okapi_spec.openapi = "3.1.0".into(); // utoipa requirement

	let spec = serde_json::to_string(&okapi_spec)?;

	serde_json::from_str::<UtoipaSpec>(&spec).map_err(Into::into)
}
