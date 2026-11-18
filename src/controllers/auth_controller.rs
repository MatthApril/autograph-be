use axum::{Json, extract::State};
use serde_json::{Value, json};

use crate::config::app_state::AppState;

pub async fn google_login(State(state): State<AppState>) -> Json<Value> {
    Json(json!({
        "message": "User logged in successfully",
        "data": []
    }))
}

pub async fn login(State(state): State<AppState>) -> Json<Value> {
    Json(json!({
        "message": "User logged in successfully",
        "data": []
    }))
}

pub async fn register(State(state): State<AppState>) -> Json<Value> {
    Json(json!({
        "message": "User registered successfully",
        "data": []
    }))
}

pub async fn refresh(State(state): State<AppState>) -> Json<Value> {
    Json(json!({
        "message": "User refreshed successfully",
        "data": []
    }))
}

pub async fn logout(State(state): State<AppState>) -> Json<Value> {
    Json(json!({
        "message": "User logged out successfully",
        "data": []
    }))
}
