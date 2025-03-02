pub fn init_static() {
	crate::auth::init_static();
	crate::dto::init_static();

	#[cfg(feature = "email")]
	crate::email::init_static();

	#[cfg(feature = "vite")]
	crate::vite::init_static();
}
