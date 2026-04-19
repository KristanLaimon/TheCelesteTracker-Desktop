use crate::events::CelesteEvent;
use crate::db::init_schema;
use rusqlite::Connection;
use futures_util::StreamExt;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::{sleep, Duration};
use tokio_tungstenite::connect_async;
use sysinfo::{ProcessRefreshKind, RefreshKind, System, ProcessesToUpdate};

pub struct WsState {
    pub last_db_location: Mutex<Option<CelesteEvent>>,
}

fn is_celeste_running() -> bool {
    let mut sys = System::new_with_specifics(
        RefreshKind::nothing().with_processes(ProcessRefreshKind::nothing()),
    );
    sys.refresh_processes_specifics(
        ProcessesToUpdate::All,
        true,
        ProcessRefreshKind::nothing(),
    );
    
    sys.processes().values().any(|process| {
        process.name()
            .to_str()
            .map(|s| s.to_lowercase().contains("celeste"))
            .unwrap_or(false)
    })
}

pub fn start_websocket_handler(app_handle: AppHandle) {
    tokio::spawn(async move {
        let mut port = 50500;
        loop {
            if !is_celeste_running() {
                // If Celeste isn't running, wait and reset
                port = 50500;
                sleep(Duration::from_secs(5)).await;
                continue;
            }

            let url = format!("ws://localhost:{}", port);
            match connect_async(&url).await {
                Ok((ws_stream, _)) => {
                    println!("SUCCESS: Connected to {}", url);
                    let _ = app_handle.emit("ws-connected", &url);

                    let (_, mut read) = ws_stream.split();
                    while let Some(message) = read.next().await {
                        if !is_celeste_running() {
                             break;
                        }

                        if let Ok(msg) = message {
                            if let Ok(text) = msg.to_text() {
                                match serde_json::from_str::<CelesteEvent>(text) {
                                    Ok(event) => {
                                        match &event {
                                            CelesteEvent::DatabaseLocation { DatabasePath, .. } | 
                                            CelesteEvent::ModStarted { DatabasePath, .. } => {
                                                if let Some(state) = app_handle.try_state::<WsState>() {
                                                    let mut cache = state.last_db_location.lock().unwrap();
                                                    *cache = Some(event.clone());
                                                    println!("DB PATH SYNCED: {}", DatabasePath);

                                                    // Initialize/Update schema
                                                    if let Ok(conn) = Connection::open(DatabasePath) {
                                                        if let Err(e) = init_schema(&conn) {
                                                            println!("SCHEMA INIT ERROR: {}", e);
                                                        } else {
                                                            println!("SCHEMA INITIALIZED/UPDATED");
                                                        }
                                                    }
                                                }
                                            }
                                            _ => {}
                                        }
                                        let _ = app_handle.emit("celeste-event", event);
                                    }
                                    Err(e) => {
                                        println!("PARSE ERROR: {} | Raw: {}", e, text);
                                    }
                                }
                            }
                        }
                    }
                    println!("DISCONNECTED: {}", url);
                    let _ = app_handle.emit("ws-disconnected", &url);
                    // Reset port for next attempt
                    port = 50500;
                    sleep(Duration::from_secs(2)).await;
                }
                Err(_) => {
                    // Port scan
                    port += 1;
                    if port > 50600 {
                        port = 50500;
                        sleep(Duration::from_secs(5)).await;
                    } else {
                        // Fast scan for next port
                        sleep(Duration::from_millis(50)).await;
                    }
                }
            }
        }
    });
}
