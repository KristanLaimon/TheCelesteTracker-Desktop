use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, QuerySelect, JoinType, RelationTrait, FromQueryResult, PaginatorTrait};
use crate::db::*;
use crate::DB;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GeneralInfo {
    pub total_campaigns: i64,
    pub total_playtime: i64,
    pub total_deaths: i64,
    pub total_dashes: i64,
    pub total_strawberries: i64,
    pub total_hearts: i64,
    pub total_golden_strawberries: i64,
}

#[tauri::command]
pub async fn get_general_info(user_id: i64, slot_number: i64) -> Result<GeneralInfo, String> {
    let db = DB!();

    let save_data = save_datas::Entity::find()
        .filter(save_datas::Column::UserId.eq(user_id))
        .filter(save_datas::Column::SlotNumber.eq(slot_number))
        .one(db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Save data not found".to_string())?;

    let save_data_id = save_data.id;

    // a) Total campaigns
    let total_campaigns = campaigns::Entity::find()
        .filter(campaigns::Column::SaveDataId.eq(save_data_id))
        .count(db)
        .await
        .map_err(|e| e.to_string())? as i64;

    // b) Total Playtime
    #[derive(FromQueryResult)]
    struct PlaytimeResult { total: Option<i64> }
    let playtime = game_sessions::Entity::find()
        .join(JoinType::InnerJoin, game_sessions::Relation::Chapters.def())
        .join(JoinType::InnerJoin, chapters::Relation::Campaigns.def())
        .filter(campaigns::Column::SaveDataId.eq(save_data_id))
        .select_only()
        .column_as(game_sessions::Column::DurationMs.sum(), "total")
        .into_model::<PlaytimeResult>()
        .one(db)
        .await
        .map_err(|e| e.to_string())?
        .and_then(|r| r.total)
        .unwrap_or(0);

    // c, d, f) Deaths, Dashes, Hearts
    #[derive(FromQueryResult)]
    struct RoomStatsResult {
        deaths: Option<i64>,
        dashes: Option<i64>,
        hearts: Option<i64>,
    }
    let room_stats = game_session_chapter_room_stats::Entity::find()
        .join(JoinType::InnerJoin, game_session_chapter_room_stats::Relation::GameSessions.def())
        .join(JoinType::InnerJoin, game_sessions::Relation::Chapters.def())
        .join(JoinType::InnerJoin, chapters::Relation::Campaigns.def())
        .filter(campaigns::Column::SaveDataId.eq(save_data_id))
        .select_only()
        .column_as(game_session_chapter_room_stats::Column::DeathsInRoom.sum(), "deaths")
        .column_as(game_session_chapter_room_stats::Column::DashesInRoom.sum(), "dashes")
        .column_as(game_session_chapter_room_stats::Column::HeartsAchievedInRoom.sum(), "hearts")
        .into_model::<RoomStatsResult>()
        .one(db)
        .await
        .map_err(|e| e.to_string())?
        .unwrap_or(RoomStatsResult { deaths: Some(0), dashes: Some(0), hearts: Some(0) });

    // e, g) Strawberries and Golden
    #[derive(FromQueryResult)]
    struct BerryStatsResult {
        strawberries: Option<i64>,
        golden: Option<i64>,
        golden_wings: Option<i64>,
    }
    let berry_stats = chapter_sides::Entity::find()
        .join(JoinType::InnerJoin, chapter_sides::Relation::Chapters.def())
        .join(JoinType::InnerJoin, chapters::Relation::Campaigns.def())
        .filter(campaigns::Column::SaveDataId.eq(save_data_id))
        .select_only()
        .column_as(chapter_sides::Column::BerriesCollected.sum(), "strawberries")
        .column_as(chapter_sides::Column::GoldenstrawberryAchieved.sum(), "golden")
        .column_as(chapter_sides::Column::GoldenwingstrawberryAchieved.sum(), "golden_wings")
        .into_model::<BerryStatsResult>()
        .one(db)
        .await
        .map_err(|e| e.to_string())?
        .unwrap_or(BerryStatsResult { strawberries: Some(0), golden: Some(0), golden_wings: Some(0) });

    Ok(GeneralInfo {
        total_campaigns,
        total_playtime: playtime,
        total_deaths: room_stats.deaths.unwrap_or(0),
        total_dashes: room_stats.dashes.unwrap_or(0),
        total_strawberries: berry_stats.strawberries.unwrap_or(0),
        total_hearts: room_stats.hearts.unwrap_or(0),
        total_golden_strawberries: berry_stats.golden.unwrap_or(0) + berry_stats.golden_wings.unwrap_or(0),
    })
}
