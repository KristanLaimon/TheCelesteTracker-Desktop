use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, QuerySelect, RelationTrait, FromQueryResult, JoinType};
use crate::db::*;
use crate::DB;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LevelCollectionStats {
    pub campaign_name: String,
    pub level_name: String,
    pub level_side: String,
    pub total_time: i64,
    pub strawberries: i64,
    pub golden_strawberries: i64,
    pub hearts: i64,
    pub deaths: i64,
    pub dashes: i64,
}

#[derive(FromQueryResult)]
struct BaseStats {
    pub campaign_name: String,
    pub level_name: Option<String>,
    pub chapter_sid: String,
    pub side_id: String,
    pub strawberries: i64,
    pub golden_strawberries: i64,
}

#[derive(FromQueryResult)]
struct TimeStats {
    pub chapter_sid: String,
    pub side_id: String,
    pub total_time: i64,
}

#[derive(FromQueryResult)]
struct RoomStatsSum {
    pub chapter_sid: String,
    pub side_id: String,
    pub deaths: i64,
    pub dashes: i64,
    pub hearts: i64,
}

#[tauri::command]
pub async fn get_collection_stats(user_id: i64) -> Result<Vec<LevelCollectionStats>, String> {
    // 1. Get base data for all chapters
    let base_data: Vec<BaseStats> = chapter_sides::Entity::find()
        .column_as(campaigns::Column::CampaignNameId, "campaign_name")
        .column_as(chapters::Column::Name, "level_name")
        .column_as(chapter_sides::Column::ChapterSid, "chapter_sid")
        .column_as(chapter_sides::Column::SideId, "side_id")
        .column_as(chapter_sides::Column::BerriesCollected, "strawberries")
        .column_as(chapter_sides::Column::GoldenstrawberryAchieved, "golden_strawberries")
        .join(JoinType::InnerJoin, chapter_sides::Relation::Chapters.def())
        .join(JoinType::InnerJoin, chapters::Relation::Campaigns.def())
        .join(JoinType::InnerJoin, campaigns::Relation::SaveDatas.def())
        .filter(save_datas::Column::UserId.eq(user_id))
        .into_model::<BaseStats>()
        .all(DB!())
        .await
        .map_err(|e| e.to_string())?;

    if base_data.is_empty() {
        return Ok(Vec::new());
    }

    // 2. Aggregate time per chapter/side
    let time_data: Vec<TimeStats> = game_sessions::Entity::find()
        .select_only()
        .column(game_sessions::Column::ChapterSid)
        .column(game_sessions::Column::SideId)
        .column_as(game_sessions::Column::DurationMs.sum(), "total_time")
        .join(JoinType::InnerJoin, game_sessions::Relation::Chapters.def())
        .join(JoinType::InnerJoin, chapters::Relation::Campaigns.def())
        .join(JoinType::InnerJoin, campaigns::Relation::SaveDatas.def())
        .filter(save_datas::Column::UserId.eq(user_id))
        .group_by(game_sessions::Column::ChapterSid)
        .group_by(game_sessions::Column::SideId)
        .into_model::<TimeStats>()
        .all(DB!())
        .await
        .map_err(|e| e.to_string())?;

    let mut time_map: HashMap<(String, String), i64> = HashMap::new();
    for t in time_data {
        time_map.insert((t.chapter_sid, t.side_id), t.total_time);
    }

    // 3. Aggregate room stats per chapter/side
    let room_data: Vec<RoomStatsSum> = game_session_chapter_room_stats::Entity::find()
        .select_only()
        .column(game_session_chapter_room_stats::Column::ChapterSid)
        .column(game_session_chapter_room_stats::Column::SideId)
        .column_as(game_session_chapter_room_stats::Column::DeathsInRoom.sum(), "deaths")
        .column_as(game_session_chapter_room_stats::Column::DashesInRoom.sum(), "dashes")
        .column_as(game_session_chapter_room_stats::Column::HeartsAchievedInRoom.sum(), "hearts")
        .join(JoinType::InnerJoin, game_session_chapter_room_stats::Relation::GameSessions.def())
        .join(JoinType::InnerJoin, game_sessions::Relation::Chapters.def())
        .join(JoinType::InnerJoin, chapters::Relation::Campaigns.def())
        .join(JoinType::InnerJoin, campaigns::Relation::SaveDatas.def())
        .filter(save_datas::Column::UserId.eq(user_id))
        .group_by(game_session_chapter_room_stats::Column::ChapterSid)
        .group_by(game_session_chapter_room_stats::Column::SideId)
        .into_model::<RoomStatsSum>()
        .all(DB!())
        .await
        .map_err(|e| e.to_string())?;

    let mut room_map: HashMap<(String, String), (i64, i64, i64)> = HashMap::new();
    for r in room_data {
        room_map.insert((r.chapter_sid, r.side_id), (r.deaths, r.dashes, r.hearts));
    }

    // 4. Merge data
    let result = base_data.into_iter().map(|b| {
        let key = (b.chapter_sid.clone(), b.side_id.clone());
        let total_time = time_map.get(&key).cloned().unwrap_or(0);
        let (deaths, dashes, hearts) = room_map.get(&key).cloned().unwrap_or((0, 0, 0));

        LevelCollectionStats {
            campaign_name: b.campaign_name,
            level_name: b.level_name.unwrap_or_else(|| "Unknown".to_string()),
            level_side: match b.side_id.as_str() {
                "SIDEA" => "SIDE A".to_string(),
                "SIDEB" => "SIDE B".to_string(),
                "SIDEC" => "SIDE C".to_string(),
                _ => b.side_id,
            },
            total_time,
            strawberries: b.strawberries,
            golden_strawberries: b.golden_strawberries,
            hearts,
            deaths,
            dashes,
        }
    }).collect();

    Ok(result)
}
