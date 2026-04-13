import { onMount } from 'svelte';
import { listen } from '@tauri-apps/api/event';
import type { CelesteEvent } from '$lib/types/events';
import { celesteState } from '$lib/types/celeste_state.svelte';

export function useCelesteLogic() {
    let wsStatus = $state<'connected' | 'disconnected'>('disconnected');
    let lastUrl = $state('');

    onMount(() => {
        const unlistenConnected = listen<string>('ws-connected', (event) => {
            console.log('WS CONNECTED EVENT RECEIVED', event.payload);
            wsStatus = 'connected';
            celesteState.isConnected = true;
            lastUrl = event.payload;
        });

        const unlistenDisconnected = listen<string>('ws-disconnected', (event) => {
            console.log('WS DISCONNECTED EVENT RECEIVED', event.payload);
            wsStatus = 'disconnected';
            celesteState.isConnected = false;
        });

        const unlistenEvents = listen<CelesteEvent>('celeste-event', (event) => {
            const payload = event.payload;
            celesteState.currentEvent = payload;

            switch (payload.Type) {
                case 'LevelStart':
                case 'LevelInfo':
                    celesteState.activeLevel = {
                        AreaSid: payload.AreaSid,
                        RoomName: payload.RoomName,
                        Mode: payload.Mode
                    };
                    break;
                case 'Death':
                    celesteState.stats.totalDeaths = payload.TotalDeaths;
                    celesteState.stats.roomDeaths = payload.RoomDeaths;
                    break;
                case 'Dash':
                    celesteState.stats.totalDashes = payload.TotalDashes;
                    break;
                case 'MenuAction':
                    celesteState.activeLevel = null;
                    break;
            }
        });

        return () => {
            unlistenConnected.then(f => f());
            unlistenDisconnected.then(f => f());
            unlistenEvents.then(f => f());
        };
    });

    return {
        get wsStatus() { return wsStatus },
        get lastUrl() { return lastUrl }
    };
}
