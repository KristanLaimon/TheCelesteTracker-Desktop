use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use crate::ws::WsState;
use crate::db::get_conn;
use crate::db::campaigns::ensure_campaign;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Chapter {
    pub sid: String,
    pub campaign_id: i32,
    pub name: String,
    pub side_id: String,
    pub total_deaths: i32,
    pub total_time: i64,
    pub total_runs: i32,
}

#[tauri::command]
pub fn get_chapters(state: tauri::State<'_, WsState>, campaign_id: i32) -> Result<Vec<Chapter>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("
        SELECT ch.sid, ch.campaign_id, ch.name, cs.side_id,
               IFNULL(SUM(stats.deaths_in_room), 0) as total_deaths, 
               IFNULL(SUM(gs.duration_ms), 0) as total_time,
               COUNT(DISTINCT gs.id) as total_runs
        FROM chapters ch
        JOIN chapter_sides cs ON cs.chapter_sid = ch.sid
        LEFT JOIN game_sessions gs ON gs.chapter_side_id = cs.id
        LEFT JOIN game_session_chapter_room_stats stats ON stats.gamesession_id = gs.id
        WHERE ch.campaign_id = ?
        GROUP BY ch.sid, cs.side_id
    ").map_err(|e| e.to_string())?;

    let iter = stmt.query_map([campaign_id], |row| {
        Ok(Chapter {
            sid: row.get(0)?,
            campaign_id: row.get(1)?,
            name: row.get(2)?,
            side_id: row.get(3)?,
            total_deaths: row.get(4)?,
            total_time: row.get(5)?,
            total_runs: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;

    iter.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn ensure_chapter(conn: &Connection, campaign_id: i32, sid: &str, name: &str, mode: &str) -> Result<String> {
    conn.execute("INSERT OR IGNORE INTO chapters (sid, campaign_id, name) VALUES (?, ?, ?)", 
        params![sid, campaign_id, name])?;
    
    conn.execute("INSERT OR IGNORE INTO chapter_sides (chapter_sid, side_id) VALUES (?, ?)", 
        params![sid, mode])?;

    Ok(sid.to_string())
}
