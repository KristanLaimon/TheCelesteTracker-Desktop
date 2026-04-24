use sea_orm::EntityTrait;
use sea_orm::Order;
use sea_orm::QueryOrder;
use sea_orm::QuerySelect;
use thecelestetracker_desktop_lib as App;
use App::db::init_connection;
use App::db::*;
use App::DB;

#[tokio::main]
async fn main() {
    let db_path = String::from(
        "sqlite://C:/Users/Kristan/Desktop/Celeste Modding/TheCelesteTracker_Desktop/celestedb.db",
    );
    let _ = init_connection(db_path)
        .await
        .expect("Error initializing the database");

    let a = game_sessions::Entity::find()
        .limit(8)
        .order_by(game_sessions::Column::DateTimeStart, Order::Desc)
        .find_also_related(chapter_sides::Entity)
        .find_also_related(chapters::Entity)
        .all(DB!())
        .await
        .expect("Error trying to query game_sessions for some reason");

    for (session, side, chapter) in a {
        println!("Session ID: {}", session.id);
        if let Some(s) = side {
            println!("  Side: {}", s.side_id);
        }
        if let Some(c) = chapter {
            println!("  Chapter: {:?}", c.name);
        }
    }
}
