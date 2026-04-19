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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_database_location() {
        let json = r#"{
            "Type": "DatabaseLocation",
            "DatabasePath": "C:/path/to/db.sqlite",
            "EverestVersion": "1.2.3",
            "ModVersion": "4.5.6"
        }"#;
        let event: CelesteEvent = serde_json::from_str(json).expect("Failed to parse DatabaseLocation");
        if let CelesteEvent::DatabaseLocation { DatabasePath, EverestVersion, ModVersion } = event {
            assert_eq!(DatabasePath, "C:/path/to/db.sqlite");
            assert_eq!(EverestVersion, "1.2.3");
            assert_eq!(ModVersion, "4.5.6");
        } else {
            panic!("Expected DatabaseLocation event");
        }
    }
}
