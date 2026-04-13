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
        let mut port = 50500;
        loop {
            let url = format!("ws://localhost:{}", port);
            match connect_async(&url).await {
                Ok((ws_stream, _)) => {
                    println!("SUCCESS: Connected to {}", url);
                    let _ = app_handle.emit("ws-connected", &url);

                    let (_, mut read) = ws_stream.split();
                    while let Some(message) = read.next().await {
                        if let Ok(msg) = message {
                            if msg.is_text() {
                                let text = msg.to_text().unwrap();
                                match serde_json::from_str::<CelesteEvent>(text) {
                                    Ok(event) => {
                                        if let CelesteEvent::DatabaseLocation { .. } = &event {
                                            if let Some(state) = app_handle.try_state::<WsState>() {
                                                let mut cache = state.last_db_location.lock().unwrap();
                                                *cache = Some(event.clone());
                                            }
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
