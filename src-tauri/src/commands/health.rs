use crate::AppState;
use crate::GLOBAL_STATE;

#[tauri::command]
pub async fn get_current_app_status() -> Result<AppState, String> {
    let guard = GLOBAL_STATE
        .read()
        .unwrap_or_else(|poisoned| poisoned.into_inner());

    // Wrap the clone in Ok() to satisfy Tauri's requirement
    Ok(guard.clone())
}
