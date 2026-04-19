pub mod events;
pub mod ws;
pub mod db;
pub mod config;

use std::sync::Mutex;
use crate::events::CelesteEvent;
use crate::ws::WsState;
use crate::db::{get_campaigns, get_chapters, get_runs, get_room_deaths, fetch_all_stats, save_completed_run, update_run, delete_run, finalize_run};
use crate::config::{get_settings, save_settings};

#[tauri::command]
fn get_celeste_initial_state(state: tauri::State<'_, WsState>) -> Option<CelesteEvent> {
    let cache = state.last_db_location.lock().unwrap();
    cache.clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    tauri::Builder::default()
        .manage(WsState {
            last_db_location: Mutex::new(None),
        })
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            ws::start_websocket_handler(handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_celeste_initial_state,
            get_campaigns,
            get_chapters,
            get_runs,
            get_room_deaths,
            get_settings,
            save_settings,
            fetch_all_stats,
            save_completed_run,
            update_run,
            delete_run,
            finalize_run
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
