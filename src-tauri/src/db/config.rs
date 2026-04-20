use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Serialize, Deserialize, Default)]
pub struct DbConfig {
    pub database_path: Option<String>,
}

fn get_config_path(handle: &tauri::AppHandle) -> PathBuf {
    handle
        .path()
        .executable_dir()
        .unwrap_or_else(|_| {
            std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                .unwrap_or_else(|| PathBuf::from("."))
        })
        .join("db_config.json")
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
    let config = DbConfig {
        database_path: Some(db_path.to_string()),
    };

    if let Ok(content) = serde_json::to_string_pretty(&config) {
        let _ = fs::write(path, content);
    }
}
