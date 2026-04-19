<script lang="ts">
    import { celesteState } from '$lib/types/celeste_state.svelte';
</script>

{#if celesteState.activeLevel}
    <div class="fixed inset-0 z-[100] bg-[#131315] flex flex-col items-center justify-center p-12">
        <div class="absolute inset-0 opacity-10 pointer-events-none bg-linear-to-br from-[#ff788c]/20 to-[#67d8d2]/20">
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
