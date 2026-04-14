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

pub fn get_conn(state: &WsState) -> Result<Connection, String> {
    let path = get_db_path(state).ok_or("Database path not found")?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.busy_timeout(std::time::Duration::from_millis(5000)).map_err(|e| e.to_string())?;
    Ok(conn)
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

    // Migration: Add parent_campaign_id if it doesn't exist
    let _ = conn.execute("ALTER TABLE Campaign ADD COLUMN parent_campaign_id INTEGER", []);

    Ok(())
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
    let conn = get_conn(&state)?;

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

#[tauri::command]
pub fn get_room_deaths(state: tauri::State<'_, WsState>, run_id: i32) -> Result<Vec<RoomDeath>, String> {
    let conn = get_conn(&state)?;

    let mut stmt = conn.prepare("SELECT id, run_id, room_name, deaths FROM RoomDeath WHERE run_id = ?").map_err(|e| e.to_string())?;
    let room_death_iter = stmt.query_map([run_id], |row| {
        Ok(RoomDeath {
            id: row.get(0)?,
            run_id: row.get(1)?,
            room_name: row.get(2)?,
            deaths: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut room_deaths = Vec::new();
    for rd in room_death_iter {
        room_deaths.push(rd.map_err(|e| e.to_string())?);
    }
    Ok(room_deaths)
}

pub fn ensure_campaign(conn: &Connection, name: &str) -> Result<i32> {
    conn.execute("INSERT OR IGNORE INTO Campaign (name) VALUES (?)", [name])?;
    conn.query_row("SELECT id FROM Campaign WHERE name = ?", [name], |row| row.get(0))
}

pub fn ensure_chapter(conn: &Connection, campaign_id: i32, sid: &str, name: &str, mode: &str) -> Result<i32> {
    // Lobby detection logic: if SID has multiple levels, check if it's a sub-campaign (lobby)
    // SID pattern usually: Author/ModName/LobbyName/MapName or Author/ModName/MapName
    let parts: Vec<&str> = sid.split('/').collect();
    if parts.len() >= 4 {
        // Potential lobby pattern detected
        let mod_name = parts[1];
        let lobby_name = parts[2];
        
        // Ensure parent mod campaign exists
        let parent_id = ensure_campaign(conn, mod_name)?;
        
        // Ensure lobby campaign exists as a child of the mod
        let lobby_id = conn.query_row(
            "INSERT INTO Campaign (name, parent_campaign_id) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET parent_campaign_id = excluded.parent_campaign_id RETURNING id",
            params![lobby_name, Some(parent_id)],
            |row| row.get(0)
        ).or_else(|_| {
            conn.query_row("SELECT id FROM Campaign WHERE name = ?", [lobby_name], |row| row.get(0))
        })?;

        // Link chapter to the lobby instead of the base campaign
        conn.execute("INSERT OR IGNORE INTO Chapter (campaign_id, sid, name, mode) VALUES (?, ?, ?, ?)", 
            params![lobby_id, sid, name, mode])?;
    } else {
        conn.execute("INSERT OR IGNORE INTO Chapter (campaign_id, sid, name, mode) VALUES (?, ?, ?, ?)", 
            params![campaign_id, sid, name, mode])?;
    }
    
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
    let mut conn = get_conn(&state)?;

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

#[tauri::command]
pub fn update_run(state: tauri::State<'_, WsState>, run_id: i32, deaths: i32, strawberries: i32) -> Result<(), String> {
    let conn = get_conn(&state)?;

    // Inactive-only guard
    let (sid, mode): (String, String) = conn.query_row(
        "SELECT ch.sid, ch.mode FROM Chapter ch JOIN Run r ON r.chapter_id = ch.id WHERE r.id = ?",
        [run_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|e| e.to_string())?;

    {
        let active_sid = state.active_chapter_sid.lock().unwrap();
        let active_mode = state.active_mode.lock().unwrap();
        if active_sid.as_ref() == Some(&sid) && active_mode.as_ref() == Some(&mode) {
            return Err("Cannot update run while its chapter is active".to_string());
        }
    }

    conn.execute(
        "UPDATE Run SET deaths = ?, strawberries = ? WHERE id = ?",
        params![deaths, strawberries, run_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_run(state: tauri::State<'_, WsState>, run_id: i32) -> Result<(), String> {
    let conn = get_conn(&state)?;

    // Inactive-only guard
    let (sid, mode): (String, String) = conn.query_row(
        "SELECT ch.sid, ch.mode FROM Chapter ch JOIN Run r ON r.chapter_id = ch.id WHERE r.id = ?",
        [run_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|e| e.to_string())?;

    {
        let active_sid = state.active_chapter_sid.lock().unwrap();
        let active_mode = state.active_mode.lock().unwrap();
        if active_sid.as_ref() == Some(&sid) && active_mode.as_ref() == Some(&mode) {
            return Err("Cannot delete run while its chapter is active".to_string());
        }
    }

    conn.execute("DELETE FROM Run WHERE id = ?", [run_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM RoomDeath WHERE run_id = ?", [run_id]).map_err(|e| e.to_string())?;

    Ok(())
}

