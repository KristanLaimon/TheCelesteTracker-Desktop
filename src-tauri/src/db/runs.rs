use crate::db::campaigns::ensure_campaign;
use crate::db::chapters::ensure_chapter;
use crate::db::get_conn;
use crate::events::AreaStats;
use crate::ws::WsState;
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameSession {
    pub id: String,
    pub chapter_side_id: i32,
    pub date_time_start: String,
    pub duration_ms: i64,
    pub is_goldenberry_attempt: bool,
    pub is_goldenberry_completed: bool,
    pub total_deaths: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GameSessionRoomStats {
    pub id: i32,
    pub gamesession_id: String,
    pub room_name: String,
    pub deaths_in_room: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FinalizeRunData {
    pub save_id: i32,
    pub area_sid: String,
    pub mode: String,
    pub duration_ms: i64,
    pub deaths: i32,
    pub golden: bool,
    pub completion_time: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecentRun {
    pub id: String,
    pub chapter_name: String,
    pub side_id: String,
    pub campaign_name: String,
    pub date_time_start: String,
    pub deaths: i32,
    pub golden: bool,
}

#[tauri::command]
pub fn get_recent_runs(state: tauri::State<'_, WsState>) -> Result<Vec<RecentRun>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("
        SELECT gs.id, ch.name, cs.side_id, c.campaign_name_id, gs.date_time_start, 
               IFNULL(SUM(stats.deaths_in_room), 0) as total_deaths, gs.is_goldenberry_completed 
        FROM game_sessions gs
        JOIN chapter_sides cs ON gs.chapter_side_id = cs.id
        JOIN chapters ch ON cs.chapter_sid = ch.sid
        JOIN campaigns c ON ch.campaign_id = c.id
        LEFT JOIN game_session_chapter_room_stats stats ON stats.gamesession_id = gs.id
        GROUP BY gs.id
        ORDER BY gs.date_time_start DESC
        LIMIT 10
    ").map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(RecentRun {
                id: row.get(0)?,
                chapter_name: row.get(1)?,
                side_id: row.get(2)?,
                campaign_name: row.get(3)?,
                date_time_start: row.get(4)?,
                deaths: row.get(5)?,
                golden: row.get::<_, i32>(6)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    iter.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_runs(state: tauri::State<'_, WsState>, chapter_sid: String, side_id: String) -> Result<Vec<GameSession>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("
        SELECT gs.id, gs.chapter_side_id, gs.date_time_start, gs.duration_ms, gs.is_goldenberry_attempt, gs.is_goldenberry_completed,
               IFNULL(SUM(stats.deaths_in_room), 0) as total_deaths
        FROM game_sessions gs
        JOIN chapter_sides cs ON gs.chapter_side_id = cs.id
        LEFT JOIN game_session_chapter_room_stats stats ON stats.gamesession_id = gs.id
        WHERE cs.chapter_sid = ? AND cs.side_id = ?
        GROUP BY gs.id
        ORDER BY gs.date_time_start DESC
    ").map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([chapter_sid, side_id], |row| {
            Ok(GameSession {
                id: row.get(0)?,
                chapter_side_id: row.get(1)?,
                date_time_start: row.get(2)?,
                duration_ms: row.get(3)?,
                is_goldenberry_attempt: row.get::<_, i32>(4)? == 1,
                is_goldenberry_completed: row.get::<_, i32>(5)? == 1,
                total_deaths: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    iter.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_room_deaths(
    state: tauri::State<'_, WsState>,
    gamesession_id: String,
) -> Result<Vec<GameSessionRoomStats>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn
        .prepare("SELECT id, gamesession_id, room_name, deaths_in_room FROM game_session_chapter_room_stats WHERE gamesession_id = ?")
        .map_err(|e| e.to_string())?;
    let iter = stmt
        .query_map([gamesession_id], |row| {
            Ok(GameSessionRoomStats {
                id: row.get(0)?,
                gamesession_id: row.get(1)?,
                room_name: row.get(2)?,
                deaths_in_room: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    iter.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn finalize_run(state: tauri::State<'_, WsState>, data: FinalizeRunData) -> Result<(), String> {
    let mut conn = get_conn(&state)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let campaign_id = ensure_campaign(&tx, "Celeste").map_err(|e| e.to_string())?;
    let chapter_sid = ensure_chapter(&tx, campaign_id, &data.area_sid, &data.area_sid, &data.mode)
        .map_err(|e| e.to_string())?;

    let chapter_side_id: i32 = tx.query_row(
        "SELECT id FROM chapter_sides WHERE chapter_sid = ? AND side_id = ?",
        params![chapter_sid, data.mode],
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let session_id = uuid::Uuid::new_v4().to_string();

    tx.execute(
        "INSERT INTO game_sessions (id, chapter_side_id, date_time_start, duration_ms, is_goldenberry_attempt, is_goldenberry_completed)
         VALUES (?, ?, ?, ?, ?, ?)",
        params![
            session_id, chapter_side_id, data.completion_time, data.duration_ms,
            data.golden as i32, 0
        ],
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_completed_run(
    state: tauri::State<'_, WsState>,
    stats: AreaStats,
    save_id: i32,
) -> Result<(), String> {
    let mut conn = get_conn(&state)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let campaign_id = ensure_campaign(&tx, "Celeste").map_err(|e| e.to_string())?;
    let chapter_sid = ensure_chapter(
        &tx,
        campaign_id,
        &stats.AreaSID,
        &stats.AreaSID,
        &stats.Mode,
    )
    .map_err(|e| e.to_string())?;

    let chapter_side_id: i32 = tx.query_row(
        "SELECT id FROM chapter_sides WHERE chapter_sid = ? AND side_id = ?",
        params![chapter_sid, stats.Mode],
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;

    let session_id = uuid::Uuid::new_v4().to_string();

    tx.execute(
        "INSERT INTO game_sessions (id, chapter_side_id, date_time_start, duration_ms, is_goldenberry_attempt, is_goldenberry_completed)
         VALUES (?, ?, ?, ?, ?, ?)",
        params![
            session_id, chapter_side_id, stats.CompletionTime, stats.TimeTicks as i64,
            stats.Golden as i32, stats.Golden as i32
        ],
    ).map_err(|e| e.to_string())?;

    for (room, deaths) in stats.DeathsPerScreen {
        tx.execute(
            "INSERT INTO game_session_chapter_room_stats (gamesession_id, room_name, deaths_in_room) VALUES (?, ?, ?)",
            params![session_id, room, deaths],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_run(
    state: tauri::State<'_, WsState>,
    session_id: String,
    room_name: String,
    deaths: i32,
) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute(
        "INSERT INTO game_session_chapter_room_stats (gamesession_id, room_name, deaths_in_room) 
         VALUES (?, ?, ?) 
         ON CONFLICT(gamesession_id, room_name) DO UPDATE SET deaths_in_room = ?",
        params![session_id, room_name, deaths, deaths],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_run(state: tauri::State<'_, WsState>, session_id: String) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("DELETE FROM game_sessions WHERE id = ?", [session_id.clone()])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM game_session_chapter_room_stats WHERE gamesession_id = ?", [session_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
