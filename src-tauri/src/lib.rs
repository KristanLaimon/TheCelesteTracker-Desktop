pub mod events;
pub mod ws;
pub mod db;

use std::sync::Mutex;
use tauri::Manager;

use crate::events::CelesteEvent;
use crate::ws::WsState;
use crate::db::campaigns::{get_campaigns, fetch_all_stats};
use crate::db::chapters::get_chapters;
use crate::db::runs::{get_runs, get_room_deaths, save_completed_run, update_run, delete_run, finalize_run, get_recent_runs};

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
            
            // Try to load persisted DB path
            if let Some(path) = crate::db::config::load_persisted_db_path(&handle) {
                if let Some(state) = handle.try_state::<WsState>() {
                    let mut cache = state.last_db_location.lock().unwrap();
                    *cache = Some(CelesteEvent::DatabaseLocation {
                        DatabasePath: path,
                        EverestVersion: "Persisted".to_string(),
                        ModVersion: "Persisted".to_string(),
                    });
                }
            }

            ws::start_websocket_handler(handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_celeste_initial_state,
            get_campaigns,
            get_chapters,
            get_runs,
            get_recent_runs,
            get_room_deaths,
            fetch_all_stats,
            save_completed_run,
            update_run,
            delete_run,
            finalize_run
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
