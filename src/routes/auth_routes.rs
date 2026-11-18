use axum::{
    Router,
    routing::{get, post},
};

use crate::config::app_state::AppState;
use crate::controllers::auth_controller;

pub fn router() -> Router<AppState> {
    Router::new().route("/login", post(auth_controller::login))
}
