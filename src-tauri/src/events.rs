use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "Type")]
#[allow(non_snake_case)]
pub enum CelesteEvent {
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
