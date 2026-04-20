import type { CelesteState } from './celeste_state';

export const celesteState = $state({
    currentEvent: null,
    isConnected: false,
    everestVersion: '',
    modVersion: '',
    activeLevel: null,
    stats: {
        totalDeaths: 0,
        roomDeaths: 0,
        totalDashes: 0
    }
} satisfies CelesteState);
