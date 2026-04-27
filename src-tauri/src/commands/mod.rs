//! TheCelesteTracker [Tauri Commands]: All tauri commands to let public to frontend

pub mod db;
pub mod health;

pub fn register<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
        health::get_current_app_status,
        db::runs::runs_get_recent_ones,
        db::general_info::get_general_info,
        db::save_slots::get_save_slots,
        db::collections::get_collection_stats,
    ])
}