use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use crate::ws::WsState;
use crate::db::get_conn;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Campaign {
    pub id: i32,
    pub name: String,
    pub total_deaths: i32,
    pub total_time: i64,
    pub total_runs: i32,
    pub parent_campaign_id: Option<i32>,
}

#[tauri::command]
pub fn get_campaigns(state: tauri::State<'_, WsState>) -> Result<Vec<Campaign>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("
        SELECT c.id, c.name, 
               IFNULL(SUM(r.deaths), 0), 
               IFNULL(SUM(r.time_ticks), 0),
               COUNT(r.id),
               c.parent_campaign_id
        FROM Campaign c
        LEFT JOIN Chapter ch ON ch.campaign_id = c.id
        LEFT JOIN Run r ON r.chapter_id = ch.id
        GROUP BY c.id
    ").map_err(|e| e.to_string())?;

    let iter = stmt.query_map([], |row| {
        Ok(Campaign {
            id: row.get(0)?,
            name: row.get(1)?,
            total_deaths: row.get(2)?,
            total_time: row.get(3)?,
            total_runs: row.get(4)?,
            parent_campaign_id: row.get(5)?,
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
    conn.execute("INSERT OR IGNORE INTO Campaign (name) VALUES (?)", [name])?;
    conn.query_row("SELECT id FROM Campaign WHERE name = ?", [name], |row| row.get(0))
}
