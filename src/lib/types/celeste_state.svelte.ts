import type { CelesteEvent } from './entities';

export const celesteState = $state({
    currentEvent: null as CelesteEvent | null,
    isConnected: false,
    everestVersion: '',
    modVersion: '',
    activeLevel: null as { AreaSid: string; RoomName: string; Mode: string } | null,
    stats: {
        totalDeaths: 0,
        roomDeaths: 0,
        totalDashes: 0
    }
});
