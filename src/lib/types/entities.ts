export interface Campaign {
  id: number;
  name: string;
  total_deaths: number;
  total_time: number;
  total_runs: number;
  parent_campaign_id?: number;
  sub_campaigns?: Campaign[]; // For recursive nesting
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
  has_golden: boolean;
}

export type RunStatus = 'Active' | 'Completed' | 'Aborted';

export interface Run {
  id: number;
  save_id: number;
  chapter_id: number;
  completion_time: string | null;
  time_ticks: number;
  screens: number;
  deaths: number;
  room_deaths: number;
  strawberries: number;
  golden: boolean;
  status: RunStatus;
}

export interface RoomDeath {
  id: number;
  run_id: number;
  room_name: string;
  deaths: number;
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
  | { Type: 'StrawberryGrabbed'; IsGolden: bool; Room: string }
  | { Type: 'StrawberryCollected'; IsGolden: bool; IsGhost: bool; Room: string };
