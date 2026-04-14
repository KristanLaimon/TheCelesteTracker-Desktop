export interface User {
  id: number;
  name: string;
}

export interface SaveData {
  id: number;
  user_id: number;
  slot_number: number;
  file_name: string;
}

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

export interface Run {
  id: number;
  save_id: number;
  chapter_id: number;
  completion_time: string | null;
  time_ticks: number;
  screens: number;
  deaths: number;
  strawberries: number;
  golden: boolean;
}

export interface RoomDeath {
  id: number;
  run_id: number;
  room_name: string;
  deaths: number;
}

export interface AppSettings {
  start_behavior: 'main-menu' | 'last-session' | 'specific';
  theme: string;
  last_active_slot: number;
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
