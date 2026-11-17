use autograph_be::routes;

use axum::Router;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let app = Router::new().merge(routes::index::router());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();

    println!("Server running at http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}
