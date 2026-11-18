use autograph_be::{
    config::{app_state::AppState, database},
    routes,
};

use migration::{Migrator, MigratorTrait};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    let db = database::connect().await?;
    Migrator::up(&db, None).await?;
    let state = AppState { db };

    let app = routes::index::router().with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    println!("Server running at http://localhost:3000");
    axum::serve(listener, app).await?;
    Ok(())
}
