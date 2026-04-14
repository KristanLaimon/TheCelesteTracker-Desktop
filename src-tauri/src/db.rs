use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use crate::ws::WsState;
use crate::events::{CelesteEvent, AreaStats};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaveData {
    pub id: i32,
    pub user_id: i32,
    pub slot_number: i32,
    pub file_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Campaign {
    pub id: i32,
    pub name: String,
    pub total_deaths: i32,
    pub total_time: i64,
    pub total_runs: i32,
    pub parent_campaign_id: Option<i32>, // Added for lobby support
}

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
    pub has_golden: bool, // Added for User Story 4
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Run {
    pub id: i32,
    pub save_id: i32,
    pub chapter_id: i32,
    pub completion_time: Option<String>,
    pub time_ticks: i64,
    pub screens: i32,
    pub deaths: i32,
    pub strawberries: i32,
    pub golden: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RoomDeath {
    pub id: i32,
    pub run_id: i32,
    pub room_name: String,
    pub deaths: i32,
}

pub fn get_db_path(state: &WsState) -> Option<String> {
    let cache = state.last_db_location.lock().unwrap();
    if let Some(CelesteEvent::DatabaseLocation { Path, .. }) = &*cache {
        return Some(Path.clone());
    }
    None
}

pub fn init_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS User (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE
        );
        CREATE TABLE IF NOT EXISTS SaveData (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            slot_number INTEGER,
            file_name TEXT,
            FOREIGN KEY (user_id) REFERENCES User(id)
        );
        CREATE TABLE IF NOT EXISTS Campaign (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            parent_campaign_id INTEGER,
            FOREIGN KEY (parent_campaign_id) REFERENCES Campaign(id)
        );
        CREATE TABLE IF NOT EXISTS SaveData_Campaign_has (
            savedata_id INTEGER,
            campaign_id INTEGER,
            PRIMARY KEY (savedata_id, campaign_id),
            FOREIGN KEY (savedata_id) REFERENCES SaveData(id),
            FOREIGN KEY (campaign_id) REFERENCES Campaign(id)
        );
        CREATE TABLE IF NOT EXISTS Chapter (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id INTEGER,
            sid TEXT,
            name TEXT,
            mode TEXT,
            FOREIGN KEY (campaign_id) REFERENCES Campaign(id)
        );
        CREATE TABLE IF NOT EXISTS Run (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            save_id INTEGER,
            chapter_id INTEGER,
            completion_time TEXT,
            time_ticks INTEGER,
            screens INTEGER,
            deaths INTEGER,
            strawberries INTEGER,
            golden INTEGER,
            FOREIGN KEY (save_id) REFERENCES SaveData(id),
            FOREIGN KEY (chapter_id) REFERENCES Chapter(id)
        );
        CREATE TABLE IF NOT EXISTS RoomDeath (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            room_name TEXT,
            deaths INTEGER,
            FOREIGN KEY (run_id) REFERENCES Run(id)
        );
    ")?;
    Ok(())
}

#[tauri::command]
pub fn get_campaigns(state: tauri::State<'_, WsState>) -> Result<Vec<Campaign>, String> {
    let path = get_db_path(&state).ok_or("Database path not found")?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;

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

    let campaign_iter = stmt.query_map([], |row| {
        Ok(Campaign {
            id: row.get(0)?,
            name: row.get(1)?,
            total_deaths: row.get(2)?,
            total_time: row.get(3)?,
            total_runs: row.get(4)?,
            parent_campaign_id: row.get(5)?,
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
            has_golden: false, // Default for now
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

    let mut stmt = conn.prepare("SELECT id, save_id, chapter_id, completion_time, time_ticks, screens, deaths, strawberries, golden FROM Run WHERE chapter_id = ? ORDER BY id DESC").map_err(|e| e.to_string())?;
    let run_iter = stmt.query_map([chapter_id], |row| {
        Ok(Run {
            id: row.get(0)?,
            save_id: row.get(1)?,
            chapter_id: row.get(2)?,
            completion_time: row.get(3)?,
            time_ticks: row.get(4)?,
            screens: row.get(5)?,
            deaths: row.get(6)?,
            strawberries: row.get(7)?,
            golden: row.get::<_, i32>(8)? == 1,
        })
    }).map_err(|e| e.to_string())?;

    let mut runs = Vec::new();
    for run in run_iter {
        runs.push(run.map_err(|e| e.to_string())?);
    }
    Ok(runs)
}

pub fn ensure_campaign(conn: &Connection, name: &str) -> Result<i32> {
    conn.execute("INSERT OR IGNORE INTO Campaign (name) VALUES (?)", [name])?;
    conn.query_row("SELECT id FROM Campaign WHERE name = ?", [name], |row| row.get(0))
}

pub fn ensure_chapter(conn: &Connection, campaign_id: i32, sid: &str, name: &str, mode: &str) -> Result<i32> {
    conn.execute("INSERT OR IGNORE INTO Chapter (campaign_id, sid, name, mode) VALUES (?, ?, ?, ?)", 
        params![campaign_id, sid, name, mode])?;
    conn.query_row("SELECT id FROM Chapter WHERE sid = ? AND mode = ?", [sid, mode], |row| row.get(0))
}

#[tauri::command]
pub fn fetch_all_stats(state: tauri::State<'_, WsState>) -> Result<serde_json::Value, String> {
    let campaigns = get_campaigns(state)?;
    Ok(serde_json::json!({
        "campaigns": campaigns,
    }))
}

#[tauri::command]
pub fn save_completed_run(state: tauri::State<'_, WsState>, stats: AreaStats, save_id: i32) -> Result<(), String> {
    let path = get_db_path(&state).ok_or("Database path not found")?;
    let mut conn = Connection::open(path).map_err(|e| e.to_string())?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let campaign_id = ensure_campaign(&tx, "Celeste").map_err(|e| e.to_string())?; // Default for now
    let chapter_id = ensure_chapter(&tx, campaign_id, &stats.AreaSID, &stats.AreaSID, &stats.Mode).map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO Run (save_id, chapter_id, completion_time, time_ticks, screens, deaths, strawberries, golden)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            save_id,
            chapter_id,
            stats.CompletionTime,
            stats.TimeTicks as i64,
            stats.Screens as i32,
            stats.Deaths as i32,
            0, 
            if stats.Golden { 1 } else { 0 }
        ],
    ).map_err(|e| e.to_string())?;

    let run_id = tx.last_insert_rowid();

    for (room_name, deaths) in stats.DeathsPerScreen {
        tx.execute(
            "INSERT INTO RoomDeath (run_id, room_name, deaths) VALUES (?, ?, ?)",
            params![run_id, room_name, deaths],
        ).map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}
