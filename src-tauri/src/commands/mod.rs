//! TheCelesteTracker [Tauri Commands]: All tauri commands to let public to frontend
pub mod db;

#[tauri::command]
pub async fn init_db(path: String) -> Result<(), String> {
    crate::db::init_connection(format!("sqlite:{}", path))
        .await
        .map_err(|e| e.to_string())
}

pub fn register<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
        init_db,
        db::runs::runs_get_recent_ones,
        db::general_info::get_general_info,
        db::save_slots::get_save_slots,
    ])
}