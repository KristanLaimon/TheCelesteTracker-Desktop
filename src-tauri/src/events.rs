use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "Type")]
#[allow(non_snake_case)]
pub enum CelesteEvent {
    DatabaseLocation {
        DatabasePath: String,
        EverestVersion: String,
        ModVersion: String,
    },
    ModStarted {
        DatabasePath: String,
        Timestamp: String,
    },
    GameClosing {
        IsClosing: bool,
        Reason: String,
        Exception: Option<String>,
    },
    SessionStarted {
        Session: serde_json::Value,
    },
    RoomEntered {
        Room: String,
        SessionId: String,
    },
    SessionExited {
        SessionId: String,
    },
    Death {
        TotalDeaths: u32,
        Room: String,
    },
    Jump {
        TotalJumps: u32,
        RoomJumps: u32,
    },
    Dash {
        TotalDashes: u32,
        RoomDashes: u32,
    },
    StrawberryGrabbed {
        IsGolden: bool,
        Room: String,
    },
    StrawberryCollected {
        IsGolden: bool,
        IsGhost: bool,
        Room: String,
    },
}
