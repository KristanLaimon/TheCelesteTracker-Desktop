use crate::events::CelesteEvent;
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};
use tokio::time::{sleep, Duration};
use tokio_tungstenite::connect_async;

pub fn start_websocket_handler(app_handle: AppHandle) {
    tokio::spawn(async move {
        let mut port = 50500;
        loop {
            let url = format!("ws://localhost:{}", port);
            match connect_async(&url).await {
                Ok((ws_stream, _)) => {
                    println!("SUCCESS: Connected to {}", url);
                    
                    // Keep emitting until success
                    loop {
                        if let Ok(_) = app_handle.emit("ws-connected", &url) {
                            break;
                        }
                        sleep(Duration::from_millis(100)).await;
                    }

                    let (_, mut read) = ws_stream.split();
                    while let Some(message) = read.next().await {
                        if let Ok(msg) = message {
                            if msg.is_text() {
                                let text = msg.to_text().unwrap();
                                match serde_json::from_str::<CelesteEvent>(text) {
                                    Ok(event) => {
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
                }
                Err(_) => {
                    port += 1;
                    if port > 50600 {
                        port = 50500;
                        sleep(Duration::from_secs(5)).await;
                    } else {
                        sleep(Duration::from_millis(10)).await;
                    }
                }
            }
        }
    });
}
