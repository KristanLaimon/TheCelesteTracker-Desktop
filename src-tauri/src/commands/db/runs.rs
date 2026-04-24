use sea_orm::EntityTrait;
use sea_orm::Order;
use sea_orm::QueryOrder;
use sea_orm::QuerySelect;

use crate::db::*;
use crate::DB;
use sea_orm::error::DbErr as OrmError;

#[tauri::command]
pub async fn runs_get_recent_ones() -> Result<(), OrmError> {
    let a: Vec<(
        game_sessions::Model,
        Option<chapter_sides::Model>,
        Option<chapters::Model>,
    )> = game_sessions::Entity::find()
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

    Ok(())
}
