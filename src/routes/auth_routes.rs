use axum::{
    Router,
    routing::{get, post},
};

use crate::config::app_state::AppState;
use crate::controllers::auth_controller;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/login", post(auth_controller::login))
        .route("/register", post(auth_controller::register))
        .route("/refresh", get(auth_controller::refresh))
        .route("/logout", post(auth_controller::logout))
        .route("/google-login", post(auth_controller::google_login))
}
