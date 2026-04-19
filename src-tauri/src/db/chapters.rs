use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use crate::ws::WsState;
use crate::db::get_conn;
use crate::db::campaigns::ensure_campaign;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Chapter {
    pub id: i32,
    pub campaign_id: i32,
    pub sid: String,
    pub name: String,
    pub mode: String,
    pub total_deaths: i32,
    pub total_time: i64,
    pub total_runs: i32,
    pub has_golden: bool,
}

#[tauri::command]
pub fn get_chapters(state: tauri::State<'_, WsState>, campaign_id: i32) -> Result<Vec<Chapter>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("
        SELECT ch.id, ch.campaign_id, ch.sid, ch.name, ch.mode,
               IFNULL(SUM(r.deaths), 0), 
               IFNULL(SUM(r.time_ticks), 0),
               COUNT(r.id)
        FROM Chapter ch
        LEFT JOIN Run r ON r.chapter_id = ch.id
        WHERE ch.campaign_id = ?
        GROUP BY ch.id
    ").map_err(|e| e.to_string())?;

    let iter = stmt.query_map([campaign_id], |row| {
        Ok(Chapter {
            id: row.get(0)?,
            campaign_id: row.get(1)?,
            sid: row.get(2)?,
            name: row.get(3)?,
            mode: row.get(4)?,
            total_deaths: row.get(5)?,
            total_time: row.get(6)?,
            total_runs: row.get(7)?,
            has_golden: false,
        })
    }).map_err(|e| e.to_string())?;

    iter.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn ensure_chapter(conn: &Connection, campaign_id: i32, sid: &str, name: &str, mode: &str) -> Result<i32> {
    let parts: Vec<&str> = sid.split('/').collect();
    if parts.len() >= 4 {
        let mod_name = parts[1];
        let lobby_name = parts[2];
        let parent_id = ensure_campaign(conn, mod_name)?;
        
        let lobby_id: i32 = conn.query_row(
            "INSERT INTO Campaign (name, parent_campaign_id) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET parent_campaign_id = excluded.parent_campaign_id RETURNING id",
            params![lobby_name, Some(parent_id)],
            |row| row.get(0)
        ).or_else(|_| conn.query_row("SELECT id FROM Campaign WHERE name = ?", [lobby_name], |row| row.get(0)))?;

        conn.execute("INSERT OR IGNORE INTO Chapter (campaign_id, sid, name, mode) VALUES (?, ?, ?, ?)", 
            params![lobby_id, sid, name, mode])?;
    } else {
        conn.execute("INSERT OR IGNORE INTO Chapter (campaign_id, sid, name, mode) VALUES (?, ?, ?, ?)", 
            params![campaign_id, sid, name, mode])?;
    }
    conn.query_row("SELECT id FROM Chapter WHERE sid = ? AND mode = ?", [sid, mode], |row| row.get(0))
}
