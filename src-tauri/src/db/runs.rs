use crate::db::campaigns::ensure_campaign;
use crate::db::chapters::ensure_chapter;
use crate::db::get_conn;
use crate::events::AreaStats;
use crate::ws::WsState;
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Run {
    pub id: i32,
    pub save_id: i32,
    pub chapter_id: i32,
    pub completion_time: Option<String>,
    pub time_ticks: i64,
    pub screens: i32,
    pub deaths: i32,
    pub room_deaths: i32,
    pub strawberries: i32,
    pub golden: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RoomDeath {
    pub id: i32,
    pub run_id: i32,
    pub room_name: String,
    pub deaths: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FinalizeRunData {
    pub save_id: i32,
    pub area_sid: String,
    pub mode: String,
    pub time_ticks: i64,
    pub screens: i32,
    pub deaths: i32,
    pub strawberries: i32,
    pub golden: bool,
    pub completion_time: String,
}

#[tauri::command]
pub fn get_runs(state: tauri::State<'_, WsState>, chapter_id: i32) -> Result<Vec<Run>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn.prepare("
        SELECT id, save_id, chapter_id, completion_time, time_ticks, screens, deaths, strawberries, golden 
        FROM Run WHERE chapter_id = ? ORDER BY id DESC
    ").map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([chapter_id], |row| {
            Ok(Run {
                id: row.get(0)?,
                save_id: row.get(1)?,
                chapter_id: row.get(2)?,
                completion_time: row.get(3)?,
                time_ticks: row.get(4)?,
                screens: row.get(5)?,
                deaths: row.get(6)?,
                room_deaths: 0,
                strawberries: row.get(7)?,
                golden: row.get::<_, i32>(8)? == 1,
            })
        })
        .map_err(|e| e.to_string())?;

    iter.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_room_deaths(
    state: tauri::State<'_, WsState>,
    run_id: i32,
) -> Result<Vec<RoomDeath>, String> {
    let conn = get_conn(&state)?;
    let mut stmt = conn
        .prepare("SELECT id, run_id, room_name, deaths FROM RoomDeath WHERE run_id = ?")
        .map_err(|e| e.to_string())?;
    let iter = stmt
        .query_map([run_id], |row| {
            Ok(RoomDeath {
                id: row.get(0)?,
                run_id: row.get(1)?,
                room_name: row.get(2)?,
                deaths: row.get(3)?,
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
    let chapter_id = ensure_chapter(&tx, campaign_id, &data.area_sid, &data.area_sid, &data.mode)
        .map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO Run (save_id, chapter_id, completion_time, time_ticks, screens, deaths, strawberries, golden)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            data.save_id, chapter_id, data.completion_time, data.time_ticks,
            data.screens, data.deaths, data.strawberries, data.golden as i32
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
    let chapter_id = ensure_chapter(
        &tx,
        campaign_id,
        &stats.AreaSID,
        &stats.AreaSID,
        &stats.Mode,
    )
    .map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO Run (save_id, chapter_id, completion_time, time_ticks, screens, deaths, strawberries, golden)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            save_id, chapter_id, stats.CompletionTime, stats.TimeTicks as i64,
            stats.Screens as i32, stats.Deaths as i32, 0, stats.Golden as i32
        ],
    ).map_err(|e| e.to_string())?;

    let run_id = tx.last_insert_rowid();

    for (room, deaths) in stats.DeathsPerScreen {
        tx.execute(
            "INSERT INTO RoomDeath (run_id, room_name, deaths) VALUES (?, ?, ?)",
            params![run_id, room, deaths],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_run(
    state: tauri::State<'_, WsState>,
    run_id: i32,
    deaths: i32,
    strawberries: i32,
) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute(
        "UPDATE Run SET deaths = ?, strawberries = ? WHERE id = ?",
        params![deaths, strawberries, run_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_run(state: tauri::State<'_, WsState>, run_id: i32) -> Result<(), String> {
    let conn = get_conn(&state)?;
    conn.execute("DELETE FROM Run WHERE id = ?", [run_id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM RoomDeath WHERE run_id = ?", [run_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
