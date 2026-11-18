use axum::{Json, extract::State};
use serde_json::{Value, json};

use crate::config::app_state::AppState;

pub async fn login(State(state): State<AppState>) -> Json<Value> {
    Json(json!({
        "message": "User logged in successfully",
        "data": []
    }))
}
