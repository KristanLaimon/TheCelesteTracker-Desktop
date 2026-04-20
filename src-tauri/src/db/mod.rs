use rusqlite::Connection;
use crate::ws::WsState;
use crate::events::CelesteEvent;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

pub mod campaigns;
pub mod chapters;
pub mod runs;

#[derive(Serialize, Deserialize, Default)]
struct DbConfig {
    database_path: Option<String>,
}

fn get_config_path(handle: &tauri::AppHandle) -> PathBuf {
    handle.path().app_data_dir().unwrap_or_else(|_| PathBuf::from(".")).join("db_config.json")
}

pub fn load_persisted_db_path(handle: &tauri::AppHandle) -> Option<String> {
    let path = get_config_path(handle);
    if let Ok(content) = fs::read_to_string(path) {
        if let Ok(config) = serde_json::from_str::<DbConfig>(&content) {
            return config.database_path;
        }
    }
    None
}

pub fn persist_db_path(handle: &tauri::AppHandle, db_path: &str) {
    let path = get_config_path(handle);
    let config = DbConfig { database_path: Some(db_path.to_string()) };
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(content) = serde_json::to_string(&config) {
        let _ = fs::write(path, content);
    }
}

pub fn get_db_path(state: &WsState) -> Option<String> {
    let cache = state.last_db_location.lock().unwrap();
    cache.as_ref().and_then(|event| match event {
        CelesteEvent::DatabaseLocation { DatabasePath, .. } => Some(DatabasePath.clone()),
        CelesteEvent::ModStarted { DatabasePath, .. } => Some(DatabasePath.clone()),
        _ => None,
    })
}

pub fn get_conn(state: &WsState) -> Result<Connection, String> {
    let path = get_db_path(state).ok_or("Database path not found")?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.busy_timeout(std::time::Duration::from_millis(5000)).map_err(|e| e.to_string())?;
    Ok(conn)
}
