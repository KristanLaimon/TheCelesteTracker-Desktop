use sea_orm::ColumnTrait;
use sea_orm::EntityTrait;
use sea_orm::Order;
use sea_orm::QueryFilter;
use sea_orm::QueryOrder;
use sea_orm::QuerySelect;

use crate::db::*;
use crate::DB;
use serde::{Serialize, Deserialize};

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

    let campaign_ids: Vec<i64> = query_result.iter()
        .filter_map(|(_, chapter)| chapter.as_ref().map(|c| c.campaign_id))
        .collect();

    let campaigns = campaigns::Entity::find()
        .filter(campaigns::Column::Id.is_in(campaign_ids))
        .all(DB!())
        .await
        .map_err(|e| e.to_string())?;

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

        #[derive(sea_orm::FromQueryResult)]
        struct RoomTotals {
            total_deaths: i64,
            total_dashes: i64,
            total_jumps: i64,
            total_strawberries_achieved: i32
        }

        let totals = game_session_chapter_room_stats::Entity::find()
            .filter(game_session_chapter_room_stats::Column::GamesessionId.eq(session.id.clone()))
            .select_only()
            .column_as(game_session_chapter_room_stats::Column::DeathsInRoom.sum(), "total_deaths")
            .column_as(game_session_chapter_room_stats::Column::DashesInRoom.sum(), "total_dashes")
            .column_as(game_session_chapter_room_stats::Column::JumpsInRoom.sum(), "total_jumps")
            .column_as(game_session_chapter_room_stats::Column::StrawberriesAchievedInRoom.sum(), "total_strawberries_achieved")
            .into_model::<RoomTotals>()
            .one(DB!())
            .await
            .map_err(|e| e.to_string())?;

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
            deaths: totals.as_ref().map_or(0, |x| x.total_deaths),
            dashes: totals.as_ref().map_or(0, |x| x.total_dashes),
            jumps: totals.as_ref().map_or(0, |x| x.total_jumps),
            berries_achieved: totals.as_ref().map_or(0, |x| x.total_strawberries_achieved),
            status: status,
            icon_path: "".to_string(),
        });
    }

    Ok(to_return)
}
