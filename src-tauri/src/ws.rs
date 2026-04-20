use crate::events::CelesteEvent;
use futures_util::StreamExt;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::{sleep, Duration};
use tokio_tungstenite::connect_async;

pub struct WsState {
    pub last_db_location: Mutex<Option<CelesteEvent>>,
}

pub fn start_websocket_handler(app_handle: AppHandle) {
    tokio::spawn(async move {
        loop {
            let mut port = 50500;
            let mut connected = false;
            
            while port <= 50600 {
                let url = format!("ws://localhost:{}", port);
                match connect_async(&url).await {
                    Ok((ws_stream, _)) => {
                        println!("SUCCESS: Connected to {}", url);
                        let _ = app_handle.emit("ws-connected", &url);
                        connected = true;

                        let (_, mut read) = ws_stream.split();
                        while let Some(message) = read.next().await {
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
                                                        // Persist to JSON
                                                        crate::db::config::persist_db_path(&app_handle, DatabasePath);
                                                        println!("DB PATH SYNCED & PERSISTED: {}", DatabasePath);
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
                        break; // Connection lost, restart scan from base port
                    }
                    Err(_) => {
                        port += 1;
                        // Small delay between port probes to avoid slamming the OS
                        sleep(Duration::from_millis(10)).await;
                    }
                }
            }

            if !connected {
                // If no ports responded, wait longer before scanning again
                sleep(Duration::from_secs(5)).await;
            } else {
                // If we were connected and lost it, wait a bit before restarting
                sleep(Duration::from_secs(2)).await;
            }
        }
    });
}
