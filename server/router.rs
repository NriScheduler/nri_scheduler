use ::std::sync::Arc;
use axum::{
	Router, middleware,
	routing::{get, post, put},
};
#[cfg(feature = "swagger")]
use utoipa_swagger_ui::SwaggerUi;

#[cfg(feature = "cors")]
use crate::cors;
#[cfg(feature = "swagger")]
use crate::openapi;
#[cfg(feature = "vite")]
use crate::vite::proxy_to_vite;
use crate::{auth, handlers as H, repository::Repository};

pub fn create_router(repo: Arc<Repository>) -> Router {
	let router = Router::new()
		.nest(
			"/api",
			Router::new()
				.route("/registration", post(H::registration))
				.route("/signin", post(H::sign_in))
				.route("/logout", post(H::logout))
				.route("/locations", get(H::locations::get_locations_list))
				.route("/locations/{id}", get(H::locations::get_location_by_id))
				.merge(
					Router::new()
						.route("/profile/{id}", get(H::read_another_profile))
						.route("/companies/{id}", get(H::companies::get_company_by_id))
						.route("/events", get(H::events::read_events_list))
						.route("/events/{id}", get(H::events::read_event))
						.layer(middleware::from_fn(auth::optional_auth_middleware)),
				)
				.merge(
					Router::new()
						.route("/check", get(H::who_i_am))
						.route("/profile", get(H::read_my_profile)) // todo удалить
						.route("/profile/my", get(H::read_my_profile))
						.route("/locations", post(H::locations::add_location))
						.route("/companies", post(H::companies::add_company))
						.route("/companies/my", get(H::companies::get_my_companies))
						.route("/companies/{id}", put(H::companies::update_company))
						.route("/events", post(H::events::add_event))
						.route("/events/apply/{id}", post(H::events::apply_event))
						.route("/events/{id}", put(H::events::update_event))
						.layer(middleware::from_fn(auth::auth_middleware)),
				),
		)
		.with_state(repo);

	#[cfg(feature = "vite")]
	let router = router.fallback(proxy_to_vite);

	#[cfg(feature = "cors")]
	let router = router.layer(middleware::from_fn(cors::cors_middleware));

	#[cfg(feature = "swagger")]
	let router = router.merge(SwaggerUi::new("/swagger").url("/swagger.json", openapi::get_schema()));

	return router;
}
