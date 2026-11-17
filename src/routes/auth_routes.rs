use axum::{
    Router,
    routing::{get, post},
};

use crate::controllers::auth_controller;

pub fn router() -> Router {
    Router::new().route("/login", post(auth_controller::login))
}
