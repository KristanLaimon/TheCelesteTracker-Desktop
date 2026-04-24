use thecelestetracker_desktop_lib::commands::db::runs::runs_get_recent_ones;
use thecelestetracker_desktop_lib as App;
use App::db::init_connection;

#[tokio::main]
async fn main() {
    let db_path = String::from(
        "sqlite://C:/Users/Kristan/Desktop/Celeste Modding/TheCelesteTracker_Desktop/celestedb.db",
    );
    let _ = init_connection(db_path)
        .await
        .expect("Error initializing the database");

    let res = runs_get_recent_ones(Some(10), None).await.expect("strange error with db");

    dbg!(res);
}
