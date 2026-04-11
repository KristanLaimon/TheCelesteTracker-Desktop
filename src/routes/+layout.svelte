<script lang="ts">
    import { onMount } from 'svelte';
    import { listen } from '@tauri-apps/api/event';
    import type { CelesteEvent } from '$lib/types/events';
    import { LayoutPropsState } from '$lib/state.svelte';
    import { celesteState } from '$lib/types/celeste_state.svelte';
    import '../app.css';

    let { children, data } = $props();
    let wsStatus = $state<'connected' | 'disconnected'>('disconnected');
    let lastUrl = $state('');

    $effect(() => {
        const activeClass = (data as any).bodyClassName || LayoutPropsState.bodyClass;
        if (activeClass) {
            document.body.className = activeClass;
        }
    });

    onMount(() => {
        // Trigger manual check in case we missed the emit
        const checkStatus = setInterval(() => {
            if (wsStatus === 'disconnected') {
                 // We can't easily poll without a command, 
                 // but Rust is now retrying emit.
            }
        }, 1000);

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
                case 'AreaComplete':
                    // Keep level info for a moment or clear? 
                    // API says AreaComplete is end of chapter.
                    break;
            }
        });

        return () => {
            unlistenConnected.then(f => f());
            unlistenDisconnected.then(f => f());
            unlistenEvents.then(f => f());
        };
    });
</script>

<!-- Header -->
<header class="fixed top-0 left-0 w-full h-16 bg-[#131315]/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-6 md:px-12 z-50">
    <div class="flex items-center gap-8">
        <span class="font-['Space_Grotesk'] font-black text-xl text-[#ffc971] tracking-tight">Celeste Tracker</span>
        <nav class="hidden lg:flex gap-6">
            <a class="text-sm font-medium text-zinc-400 hover:text-[#ff788c] transition-colors" href="/">Dashboard</a>
            <a class="text-sm font-medium text-zinc-400 hover:text-[#ff788c] transition-colors" href="/stats">Global Stats</a>
        </nav>
    </div>
    <div class="flex items-center gap-4 md:gap-6">
        <div class="flex items-center gap-2">
            <button class="p-2 text-zinc-400 hover:text-white transition-colors">
                <span class="material-symbols-outlined">settings</span>
            </button>
        </div>
        <div class="hidden sm:block h-8 w-px bg-white/10"></div>
        <button class="hidden sm:block px-4 py-1.5 bg-zinc-900 text-[#67d8d2] font-bold rounded-lg border border-[#67d8d2]/20 hover:bg-[#67d8d2]/10 transition-all text-xs">
            Live Run
        </button>
        <div class="w-8 h-8 rounded-full border border-[#ff788c]/40 bg-[#ff788c]/10 flex items-center justify-center text-[#ff788c] text-[10px] font-bold">KT</div>
    </div>
</header>

{@render children()}

<!-- Live Overlay -->
{#if celesteState.activeLevel}
    <div class="fixed inset-0 z-[100] bg-[#131315] flex flex-col items-center justify-center p-12">
        <div class="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br from-[#ff788c]/20 to-[#67d8d2]/20">
        </div>
        
        <div class="relative z-10 text-center space-y-8 w-full max-w-4xl">
            <div class="space-y-2">
                <h2 class="text-[#ffc971] font-['Space_Grotesk'] text-2xl uppercase tracking-widest font-bold">Currently Playing</h2>
                <h1 class="text-6xl md:text-8xl font-['Space_Grotesk'] font-black text-white tracking-tighter">
                    {celesteState.activeLevel.AreaSid.split('/').pop()}
                </h1>
                <p class="text-[#67d8d2] text-xl font-bold tracking-tight">Room: {celesteState.activeLevel.RoomName} • Mode: {celesteState.activeLevel.Mode}</p>
            </div>

            <div class="grid grid-cols-3 gap-8 py-12 border-y border-white/10">
                <div class="space-y-1">
                    <span class="text-zinc-500 uppercase text-xs font-bold tracking-widest">Deaths</span>
                    <p class="text-4xl font-black text-white">{celesteState.stats.totalDeaths}</p>
                    <span class="text-[#ff788c] text-sm">+{celesteState.stats.roomDeaths} this room</span>
                </div>
                <div class="space-y-1">
                    <span class="text-zinc-500 uppercase text-xs font-bold tracking-widest">Dashes</span>
                    <p class="text-4xl font-black text-white">{celesteState.stats.totalDashes}</p>
                </div>
                <div class="space-y-1">
                    <span class="text-zinc-500 uppercase text-xs font-bold tracking-widest">Status</span>
                    <p class="text-4xl font-black text-[#67d8d2]">ACTIVE</p>
                </div>
            </div>
        </div>

        <div class="absolute bottom-12 text-zinc-600 text-xs font-medium tracking-widest uppercase">
            Press Menu in-game to exit tracker view
        </div>
    </div>
{/if}

<!-- Footer -->
<footer class="fixed bottom-0 left-0 w-full h-10 bg-zinc-950 border-t border-white/10 flex items-center justify-between px-6 z-50">
    <div class="flex items-center gap-4 text-[11px] font-medium text-zinc-500">
        <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full {wsStatus === 'connected' ? 'bg-[#67d8d2]' : 'bg-red-500'}"></span>
            <span>WS: {wsStatus === 'connected' ? lastUrl : 'Disconnected'}</span>
        </div>
        <div class="h-3 w-px bg-white/10"></div>
        <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-xs">terminal</span>
            <span>System Ready</span>
        </div>
    </div>
</footer>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
</style>
