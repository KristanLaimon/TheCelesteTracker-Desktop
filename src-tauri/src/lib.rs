pub mod db;
pub mod commands;
pub mod logic;

use logic::celestehelper;
use std::{sync::{LazyLock, RwLock}};
use db::init_connection;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub is_game_installed: bool,
    pub is_mod_db_initialized: bool,
}

pub static GLOBAL_STATE: LazyLock<RwLock<AppState>> = LazyLock::new(|| {
    RwLock::new(AppState {
        is_game_installed: false,
        is_mod_db_initialized: false,
    })
});

fn initialize_global_state() {
    let is_game_installed : bool = logic::celestehelper::is_game_installed_through_steam();
    let is_mod_db_initialized: bool = logic::celestehelper::is_database_mod_initialized();
    match GLOBAL_STATE.write() {
        Ok(mut state) => {
          state.is_game_installed = is_game_installed;
          state.is_mod_db_initialized = is_mod_db_initialized;
        },
        Err(poisoned) => {
        // You can actually recover the data from a poisoned lock if you want:
        let state = poisoned.into_inner();
        println!("Lock was poisoned, but data is: {}", state.is_game_installed);
    }
    }
}

async fn try_initialize_database_connection(){
    if let Ok(state)  = GLOBAL_STATE.read(){
      if !state.is_game_installed || !state.is_mod_db_initialized {
        return;
      }
    }
    let db_path: String = match celestehelper::get_game_mod_database_path() {
        Ok(db_p) => String::from(db_p.to_str().unwrap()),
        Err(_) => return,
    };
    let sqlite_con_string = String::from(format!("sqlite://{db_path}"));
    let _ = init_connection(sqlite_con_string).await.expect("Error initializing the database");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    initialize_global_state();
    try_initialize_database_connection().await;

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init());

    commands::register(builder)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
