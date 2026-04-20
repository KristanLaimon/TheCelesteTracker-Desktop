export interface Campaign {
  id: number;
  campaign_name_id: string;
  total_deaths: number;
  total_time: number;
  total_runs: number;
}

export interface Chapter {
  sid: string;
  campaign_id: number;
  name: string;
  side_id: string;
  total_deaths: number;
  total_time: number;
  total_runs: number;
}

export type RunStatus = 'Active' | 'Completed' | 'Aborted';

export interface GameSession {
  id: string;
  chapter_side_id: number;
  date_time_start: string;
  duration_ms: number;
  is_goldenberry_attempt: boolean;
  is_goldenberry_completed: boolean;
  total_deaths: number;
  status?: RunStatus;
}

export interface RecentRun {
  id: string;
  chapter_name: string;
  side_id: string;
  campaign_name: string;
  date_time_start: string;
  deaths: number;
  golden: boolean;
}

export interface GameSessionRoomStats {
  id: number;
  gamesession_id: string;
  room_name: string;
  deaths_in_room: number;
}

export interface AreaStats {
  AreaSID: string;
  Mode: string;
  CompletionTime: string;
  Screens: number;
  TimeTicks: number;
  Deaths: number;
  DeathsPerScreen: Record<string, number>;
  Golden: boolean;
}

export type CelesteEvent = 
  | { Type: 'DatabaseLocation'; DatabasePath: string; EverestVersion: string; ModVersion: string }
  | { Type: 'ModStarted'; DatabasePath: string; Timestamp: string }
  | { Type: 'GameClosing'; IsClosing: boolean; Reason: string; Exception?: string }
  | { Type: 'SessionStarted'; Session: any }
  | { Type: 'RoomEntered'; Room: string; SessionId: string }
  | { Type: 'SessionExited'; SessionId: string }
  | { Type: 'Death'; TotalDeaths: number; Room: string }
  | { Type: 'Jump'; TotalJumps: number; RoomJumps: number }
  | { Type: 'Dash'; TotalDashes: number; RoomDashes: number }
  | { Type: 'StrawberryGrabbed'; IsGolden: boolean; Room: string }
  | { Type: 'StrawberryCollected'; IsGolden: boolean; IsGhost: boolean; Room: string }
  | { Type: 'LevelStart'; AreaSid: string; RoomName: string; Mode: string }
  | { Type: 'LevelInfo'; AreaSid: string; RoomName: string; Mode: string }
  | { Type: 'AreaComplete'; Stats: AreaStats }
  | { Type: 'MenuAction'; Action: string };
