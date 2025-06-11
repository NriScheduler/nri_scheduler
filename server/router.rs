use ::std::sync::Arc;
#[cfg(not(feature = "swagger"))]
use axum::Router;
use axum::{
	Router as AxumRouter, middleware,
	routing::{get, post, put},
};
#[cfg(feature = "cors")]
use axum::{http::StatusCode, routing::options};
#[cfg(feature = "static")]
use tower_http::services::{ServeDir, ServeFile};
#[cfg(feature = "swagger")]
use utoipa::OpenApi;
#[cfg(feature = "swagger")]
use utoipa_axum::router::OpenApiRouter as Router;
#[cfg(feature = "swagger")]
use utoipa_swagger_ui::SwaggerUi;

#[cfg(feature = "cors")]
use crate::cors;
#[cfg(feature = "vite")]
use crate::vite::proxy_to_vite;
use crate::{auth, handlers as H, state::AppState};

pub fn create_router(state: Arc<AppState>) -> AxumRouter {
	#[cfg(feature = "swagger")]
	#[derive(OpenApi)]
	struct ApiDoc;

	#[cfg(not(feature = "swagger"))]
	let router = AxumRouter::new();

	#[cfg(feature = "swagger")]
	let router = Router::with_openapi(ApiDoc::openapi());

	let router = router
		.route("/avatar/{id}", get(H::read_avatar))
		.route("/cover/{id}", get(H::companies::read_company_cover))
		.nest(
			"/api",
			Router::new()
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
					Router::new()
						.route("/sse", get(H::sse::sse_handler))
						.route("/profile/{id}", get(H::read_another_profile))
						.route("/companies/{id}", get(H::companies::get_company_by_id))
						.route("/events", get(H::events::read_events_list))
						.route("/events/{id}", get(H::events::read_event))
						.layer(middleware::from_fn(auth::optional_auth_middleware)),
				)
				.merge(
					Router::new()
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
					Router::new()
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

	#[cfg(feature = "vite")]
	let router = router.fallback(proxy_to_vite);

	#[cfg(feature = "cors")]
	let router = router
		.route("/{*any}", options(|| async { StatusCode::NO_CONTENT }))
		.layer(middleware::from_fn(cors::cors_middleware));

	#[cfg(feature = "swagger")]
	let (router, api) = router.split_for_parts();

	#[cfg(feature = "swagger")]
	let router = router.merge(SwaggerUi::new("/swagger").url("/swagger.json", api));

	#[cfg(feature = "static")]
	let router = router
		.nest_service("/assets", ServeDir::new("static/assets"))
		.fallback_service(ServeFile::new("static/index.html"));

	return router;
}
