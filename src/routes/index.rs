use axum::Router;

use super::auth_routes;
use std::env;

pub fn router() -> Router {
    let api_prefix = env::var("API_PREFIX").unwrap_or_else(|_| "/api".to_string());

    let api_routes = Router::new().nest("/auth", auth_routes::router());

    Router::new().nest(&api_prefix, api_routes)
}
