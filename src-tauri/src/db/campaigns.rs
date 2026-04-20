use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use crate::ws::WsState;
use crate::db::get_conn;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Campaign {
    pub id: i32,
    pub campaign_name_id: String,
    pub total_deaths: i32,
    pub total_time: i64,
    pub total_runs: i32,
}

#[tauri::command]
pub fn get_campaigns(state: tauri::State<'_, WsState>) -> Result<Vec<Campaign>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("
        SELECT c.id, c.campaign_name_id, 
               IFNULL(SUM(stats.deaths_in_room), 0) as total_deaths, 
               IFNULL(SUM(gs.duration_ms), 0) as total_time,
               COUNT(DISTINCT gs.id) as total_runs
        FROM campaigns c
        LEFT JOIN chapters ch ON ch.campaign_id = c.id
        LEFT JOIN chapter_sides cs ON cs.chapter_sid = ch.sid
        LEFT JOIN game_sessions gs ON gs.chapter_side_id = cs.id
        LEFT JOIN game_session_chapter_room_stats stats ON stats.gamesession_id = gs.id
        GROUP BY c.id
    ").map_err(|e| e.to_string())?;

    let iter = stmt.query_map([], |row| {
        Ok(Campaign {
            id: row.get(0)?,
            campaign_name_id: row.get(1)?,
            total_deaths: row.get(2)?,
            total_time: row.get(3)?,
            total_runs: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    iter.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fetch_all_stats(state: tauri::State<'_, WsState>) -> Result<serde_json::Value, String> {
    let campaigns = get_campaigns(state)?;
    Ok(serde_json::json!({ "campaigns": campaigns }))
}

pub fn ensure_campaign(conn: &Connection, name: &str) -> Result<i32> {
    conn.execute("INSERT OR IGNORE INTO campaigns (campaign_name_id) VALUES (?)", [name])?;
    conn.query_row("SELECT id FROM campaigns WHERE campaign_name_id = ?", [name], |row| row.get(0))
}
