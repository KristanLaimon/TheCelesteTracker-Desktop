use rusqlite::Connection;
use crate::ws::WsState;
use crate::events::CelesteEvent;

pub mod campaigns;
pub mod chapters;
pub mod runs;

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
