use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "Type")]
#[allow(non_snake_case)]
pub enum CelesteEvent {
    DatabaseLocation {
        Path: String,
        EverestVersion: String,
        ModVersion: String,
    },
    LevelStart {
        AreaSid: String,
        RoomName: String,
        Mode: String,
    },
    LevelInfo {
        AreaSid: String,
        RoomName: String,
        Mode: String,
    },
    Death {
        TotalDeaths: u32,
        RoomDeaths: u32,
        RoomName: String,
    },
    Dash {
        TotalDashes: u32,
    },
    MenuAction {
        Action: String,
    },
    AreaComplete {
        Stats: AreaStats,
    },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct AreaStats {
    pub AreaSID: String,
    pub Mode: String,
    pub CompletionTime: String,
    pub Screens: u32,
    pub TimeTicks: u64,
    pub Deaths: u32,
    pub DeathsPerScreen: HashMap<String, u32>,
    pub PersonalBestTime: u64,
    pub PersonalBestDeaths: u32,
    pub Golden: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_database_location() {
        let json = r#"{
            "Type": "DatabaseLocation",
            "Path": "C:/path/to/db.sqlite",
            "EverestVersion": "1.2.3",
            "ModVersion": "4.5.6"
        }"#;
        let event: CelesteEvent = serde_json::from_str(json).expect("Failed to parse DatabaseLocation");
        if let CelesteEvent::DatabaseLocation { Path, EverestVersion, ModVersion } = event {
            assert_eq!(Path, "C:/path/to/db.sqlite");
            assert_eq!(EverestVersion, "1.2.3");
            assert_eq!(ModVersion, "4.5.6");
        } else {
            panic!("Expected DatabaseLocation event");
        }
    }

    #[test]
    fn test_parse_death() {
        let json = r#"{
            "Type": "Death",
            "TotalDeaths": 10,
            "RoomDeaths": 2,
            "RoomName": "1-ForsakenCity"
        }"#;
        let event: CelesteEvent = serde_json::from_str(json).expect("Failed to parse Death");
        if let CelesteEvent::Death { TotalDeaths, RoomDeaths, RoomName } = event {
            assert_eq!(TotalDeaths, 10);
            assert_eq!(RoomDeaths, 2);
            assert_eq!(RoomName, "1-ForsakenCity");
        } else {
            panic!("Expected Death event");
        }
    }

    #[test]
    fn test_parse_dash() {
        let json = r#"{
            "Type": "Dash",
            "TotalDashes": 50
        }"#;
        let event: CelesteEvent = serde_json::from_str(json).expect("Failed to parse Dash");
        if let CelesteEvent::Dash { TotalDashes } = event {
            assert_eq!(TotalDashes, 50);
        } else {
            panic!("Expected Dash event");
        }
    }

    #[test]
    fn test_parse_area_complete() {
        let json = r#"{
            "Type": "AreaComplete",
            "Stats": {
                "AreaSID": "Celeste/1-ForsakenCity",
                "Mode": "Normal",
                "CompletionTime": "00:10:00",
                "Screens": 20,
                "TimeTicks": 6000000000,
                "Deaths": 5,
                "DeathsPerScreen": { "room1": 1, "room2": 4 },
                "PersonalBestTime": 5000000000,
                "PersonalBestDeaths": 2,
                "Golden": false
            }
        }"#;
        let event: CelesteEvent = serde_json::from_str(json).expect("Failed to parse AreaComplete");
        if let CelesteEvent::AreaComplete { Stats } = event {
            assert_eq!(Stats.AreaSID, "Celeste/1-ForsakenCity");
            assert_eq!(Stats.Deaths, 5);
            assert_eq!(Stats.Golden, false);
        } else {
            panic!("Expected AreaComplete event");
        }
    }
}
