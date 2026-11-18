use axum::{Form, Json, extract::State, http::StatusCode};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use serde_json::{Value, json};

use crate::{
    config::app_state::AppState, entities::users, requests::auth_request::GoogleLoginRequest,
};

pub async fn google_login(
    State(state): State<AppState>,
    Form(payload): Form<GoogleLoginRequest>,
) -> (StatusCode, Json<Value>) {
    let user = users::Entity::find()
        .filter(users::Column::GoogleSub.eq(payload.id_token))
        .one(&state.db)
        .await;

    match user {
        Ok(Some(user)) => (
            StatusCode::OK,
            Json(json!({
                "message": "User found",
                "data": {
                    "user_id": user.user_id,
                    "username": user.username,
                    "email": user.email
                }
            })),
        ),

        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({
                "message": "User not found",
                "data": null
            })),
        ),

        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "message": "Database error",
                "data": null
            })),
        ),
    }
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
