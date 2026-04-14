use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub start_behavior: String,
    pub theme: String,
    pub last_active_slot: i32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            start_behavior: "main-menu".to_string(),
            theme: "dark".to_string(),
            last_active_slot: 0,
        }
    }
}

pub fn get_config_path() -> PathBuf {
    match std::env::current_exe() {
        Ok(mut path) => {
            path.pop(); // Remove executable name
            path.push("config.json");
            path
        }
        Err(_) => PathBuf::from("config.json"),
    }
}

pub fn load_config() -> AppSettings {
    let path = get_config_path();
    if path.exists() {
        let content = fs::read_to_string(path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        let config = AppSettings::default();
        save_config(&config);
        config
    }
}

pub fn save_config(config: &AppSettings) {
    let path = get_config_path();
    let content = serde_json::to_string_pretty(config).unwrap_or_default();
    let _ = fs::write(path, content);
}

#[tauri::command]
pub fn get_settings() -> AppSettings {
    load_config()
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) {
    save_config(&settings);
}
