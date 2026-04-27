use sea_orm::{ColumnTrait, EntityTrait, Order, QueryFilter, QueryOrder, QuerySelect, FromQueryResult};
use crate::db::*;
use crate::DB;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum CampaignType {
    Vanilla,
    Modded
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum AttemptType {
    #[serde(rename = "Normal")]
    Normal,
    #[serde(rename = "Golden Attempt")]
    GoldenAttempt,
    #[serde(rename = "Wings Golden")]
    WingsGolden,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum RunStatus {
    Completed,
    #[serde(rename = "Goldenberry completed")]
    GoldenberryCompleted,
    Attempted,
    PB
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RunData {
    pub level_name: String,
    pub level_side: String,
    #[serde(rename = "type")]
    pub campaign_type: CampaignType,
    pub attempt_type: AttemptType,
    pub clear_time: i64,
    pub deaths: i64,
    pub dashes: i64,
    pub jumps: i64,
    pub berries_achieved: i32,
    pub status: RunStatus,
    pub icon_path: String,
}

#[tauri::command]
pub async fn runs_get_recent_ones(limit: Option<u64>, offset: Option<u64>) -> Result<Vec<RunData>, String> {
    let limit = limit.unwrap_or(10);
    let offset = offset.unwrap_or(0);

    let query_result: Vec<(
        game_sessions::Model,
        Option<chapters::Model>,
    )> = game_sessions::Entity::find()
        .find_also_related(chapters::Entity)
        .order_by(game_sessions::Column::DateTimeStart, Order::Desc)
        .limit(limit)
        .offset(offset)
        .all(DB!())
        .await
        .map_err(|e| e.to_string())?;

    if query_result.is_empty() {
        return Ok(Vec::new());
    }

    let session_ids: Vec<String> = query_result.iter().map(|(s, _)| s.id.clone()).collect();
    let campaign_ids: Vec<i64> = query_result.iter()
        .filter_map(|(_, chapter)| chapter.as_ref().map(|c| c.campaign_id))
        .collect();

    let campaigns = campaigns::Entity::find()
        .filter(campaigns::Column::Id.is_in(campaign_ids))
        .all(DB!())
        .await
        .map_err(|e| e.to_string())?;

    #[derive(sea_orm::FromQueryResult)]
    struct RoomTotals {
        gamesession_id: String,
        total_deaths: i64,
        total_dashes: i64,
        total_jumps: i64,
        total_strawberries_achieved: i32
    }

    let totals_vec = game_session_chapter_room_stats::Entity::find()
        .filter(game_session_chapter_room_stats::Column::GamesessionId.is_in(session_ids))
        .select_only()
        .column(game_session_chapter_room_stats::Column::GamesessionId)
        .column_as(game_session_chapter_room_stats::Column::DeathsInRoom.sum(), "total_deaths")
        .column_as(game_session_chapter_room_stats::Column::DashesInRoom.sum(), "total_dashes")
        .column_as(game_session_chapter_room_stats::Column::JumpsInRoom.sum(), "total_jumps")
        .column_as(game_session_chapter_room_stats::Column::StrawberriesAchievedInRoom.sum(), "total_strawberries_achieved")
        .group_by(game_session_chapter_room_stats::Column::GamesessionId)
        .into_model::<RoomTotals>()
        .all(DB!())
        .await
        .map_err(|e| e.to_string())?;

    let mut totals_map: HashMap<String, RoomTotals> = HashMap::new();
    for t in totals_vec {
        totals_map.insert(t.gamesession_id.clone(), t);
    }

    let mut to_return: Vec<RunData> = Vec::with_capacity(query_result.len());

    for (session, chapter) in query_result {
        let attempt_type = if session.is_goldenberry_attempt == 1 {
            AttemptType::GoldenAttempt
        } else {
            AttemptType::Normal
        };

        let campaign = chapter.as_ref().and_then(|c| {
            campaigns.iter().find(|camp| camp.id == c.campaign_id)
        });

        let campaign_type = if let Some(camp) = campaign {
            if camp.campaign_name_id.to_lowercase().contains("celeste") {
                CampaignType::Vanilla
            } else {
                CampaignType::Modded
            }
        } else {
            CampaignType::Modded
        };

        let status = if session.is_goldenberry_completed == 1 {
            RunStatus::GoldenberryCompleted
        } else {
            RunStatus::Completed
        };

        let totals = totals_map.get(&session.id);

        to_return.push(RunData {
            level_name: chapter.and_then(|c| c.name).unwrap_or_else(|| "Unknown Chapter".to_string()),
            level_side: match session.side_id.as_str() {
                "SIDEA" => "SIDE A".to_string(),
                "SIDEB" => "SIDE B".to_string(),
                "SIDEC" => "SIDE C".to_string(),
                _ => session.side_id.clone(),
            },
            campaign_type: campaign_type,
            attempt_type: attempt_type,
            clear_time: session.duration_ms,
            deaths: totals.map_or(0, |x| x.total_deaths),
            dashes: totals.map_or(0, |x| x.total_dashes),
            jumps: totals.map_or(0, |x| x.total_jumps),
            berries_achieved: totals.map_or(0, |x| x.total_strawberries_achieved),
            status: status,
            icon_path: "".to_string(),
        });
    }

    Ok(to_return)
}
