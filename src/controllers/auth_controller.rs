use axum::Json;
use serde_json::{Value, json};

pub async fn login() -> Json<Value> {
    Json(json!({
        "message": "User logged in successfully",
        "data": []
    }))
}
