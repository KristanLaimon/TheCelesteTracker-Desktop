import type { CelesteEvent } from './entities';

export interface CelesteState {
    currentEvent: CelesteEvent | null;
    isConnected: boolean;
    everestVersion: string;
    modVersion: string;
    activeLevel: { AreaSid: string; RoomName: string; Mode: string } | null;
    stats: {
        totalDeaths: number;
        roomDeaths: number;
        totalDashes: number;
    };
}
