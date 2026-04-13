use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use crate::ws::WsState;
use crate::events::CelesteEvent;

#[derive(Debug, Serialize, Deserialize)]
pub struct Campaign {
    pub id: i32,
    pub name: String,
    pub total_deaths: i32,
    pub total_time: i64,
    pub total_runs: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Chapter {
    pub id: i32,
    pub campaign_id: i32,
    pub sid: String,
    pub name: String,
    pub mode: String,
    pub total_deaths: i32,
    pub total_time: i64,
    pub total_runs: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Run {
    pub id: i32,
    pub chapter_id: i32,
    pub completion_time: Option<String>,
    pub time_ticks: i64,
    pub screens: i32,
    pub deaths: i32,
    pub strawberries: i32,
    pub golden: bool,
}

pub fn get_db_path(state: &WsState) -> Option<String> {
    let cache = state.last_db_location.lock().unwrap();
    if let Some(CelesteEvent::DatabaseLocation { Path, .. }) = &*cache {
        return Some(Path.clone());
    }
    None
}

#[tauri::command]
pub fn get_campaigns(state: tauri::State<'_, WsState>) -> Result<Vec<Campaign>, String> {
    let path = get_db_path(&state).ok_or("Database path not found")?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("
        SELECT c.id, c.name, 
               IFNULL(SUM(r.deaths), 0), 
               IFNULL(SUM(r.time_ticks), 0),
               COUNT(r.id)
        FROM Campaign c
        LEFT JOIN Chapter ch ON ch.campaign_id = c.id
        LEFT JOIN Run r ON r.chapter_id = ch.id
        GROUP BY c.id
    ").map_err(|e| e.to_string())?;

    let campaign_iter = stmt.query_map([], |row| {
        Ok(Campaign {
            id: row.get(0)?,
            name: row.get(1)?,
            total_deaths: row.get(2)?,
            total_time: row.get(3)?,
            total_runs: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut campaigns = Vec::new();
    for campaign in campaign_iter {
        campaigns.push(campaign.map_err(|e| e.to_string())?);
    }
    Ok(campaigns)
}

#[tauri::command]
pub fn get_chapters(state: tauri::State<'_, WsState>, campaign_id: i32) -> Result<Vec<Chapter>, String> {
    let path = get_db_path(&state).ok_or("Database path not found")?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;

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

    let chapter_iter = stmt.query_map([campaign_id], |row| {
        Ok(Chapter {
            id: row.get(0)?,
            campaign_id: row.get(1)?,
            sid: row.get(2)?,
            name: row.get(3)?,
            mode: row.get(4)?,
            total_deaths: row.get(5)?,
            total_time: row.get(6)?,
            total_runs: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut chapters = Vec::new();
    for chapter in chapter_iter {
        chapters.push(chapter.map_err(|e| e.to_string())?);
    }
    Ok(chapters)
}

#[tauri::command]
pub fn get_runs(state: tauri::State<'_, WsState>, chapter_id: i32) -> Result<Vec<Run>, String> {
    let path = get_db_path(&state).ok_or("Database path not found")?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT id, chapter_id, completion_time, time_ticks, screens, deaths, strawberries, golden FROM Run WHERE chapter_id = ? ORDER BY id DESC").map_err(|e| e.to_string())?;
    let run_iter = stmt.query_map([chapter_id], |row| {
        Ok(Run {
            id: row.get(0)?,
            chapter_id: row.get(1)?,
            completion_time: row.get(2)?,
            time_ticks: row.get(3)?,
            screens: row.get(4)?,
            deaths: row.get(5)?,
            strawberries: row.get(6)?,
            golden: row.get::<_, i32>(7)? == 1,
        })
    }).map_err(|e| e.to_string())?;

    let mut runs = Vec::new();
    for run in run_iter {
        runs.push(run.map_err(|e| e.to_string())?);
    }
    Ok(runs)
}
