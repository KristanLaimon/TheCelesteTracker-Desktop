export interface Campaign {
    id: number;
    name: string;
    total_deaths: number;
    total_time: number;
    total_runs: number;
}

export interface Chapter {
    id: number;
    campaign_id: number;
    sid: string;
    name: string;
    mode: string;
    total_deaths: number;
    total_time: number;
    total_runs: number;
}

export interface Run {
    id: number;
    chapter_id: number;
    completion_time: string | null;
    time_ticks: number;
    screens: number;
    deaths: number;
    strawberries: number;
    golden: boolean;
}

export interface AreaStats {
    AreaSID: string;
    Mode: string;
    CompletionTime: string;
    Screens: number;
    TimeTicks: number;
    Deaths: number;
    DeathsPerScreen: Record<string, number>;
    PersonalBestTime: number;
    PersonalBestDeaths: number;
    Golden: boolean;
}

export type CelesteEvent = 
    | { Type: 'DatabaseLocation'; Path: string; EverestVersion: string; ModVersion: string }
    | { Type: 'LevelStart'; AreaSid: string; RoomName: string; Mode: string }
    | { Type: 'LevelInfo'; AreaSid: string; RoomName: string; Mode: string }
    | { Type: 'Death'; TotalDeaths: number; RoomDeaths: number; RoomName: string }
    | { Type: 'Dash'; TotalDashes: number }
    | { Type: 'MenuAction'; Action: string }
    | { Type: 'AreaComplete'; Stats: AreaStats };
