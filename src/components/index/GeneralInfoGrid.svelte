<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { onMount } from "svelte";

    interface GeneralInfo {
        totalCampaigns: number;
        totalPlaytime: number;
        totalDeaths: number;
        totalDashes: number;
        totalStrawberries: number;
        totalHearts: number;
        totalGoldenStrawberries: number;
    }

    let stats: GeneralInfo | null = $state(null);
    let error: string | null = $state(null);

    onMount(async () => {
        try {
            // Hardcoded for now as per test example
            stats = await invoke("get_general_info", { userId: 1, slotNumber: 1 });
        } catch (e) {
            error = String(e);
            console.error("Failed to fetch general info:", e);
        }
    });

    function formatTime(ms: number) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
</script>

<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
    {#if stats}
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Campaigns</p>
            <p class="text-2xl font-headline font-bold text-white">{stats.totalCampaigns}</p>
        </div>
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Playtime</p>
            <p class="text-2xl font-headline font-bold text-white">{formatTime(stats.totalPlaytime)}</p>
        </div>
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Deaths</p>
            <p class="text-2xl font-headline font-bold text-primary">{stats.totalDeaths.toLocaleString()}</p>
        </div>
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Dashes</p>
            <p class="text-2xl font-headline font-bold text-secondary">{stats.totalDashes.toLocaleString()}</p>
        </div>
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Strawberries</p>
            <p class="text-2xl font-headline font-bold text-tertiary">{stats.totalStrawberries}</p>
        </div>
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Hearts</p>
            <p class="text-2xl font-headline font-bold text-purple-400">{stats.totalHearts}</p>
        </div>
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl">
            <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Goldens</p>
            <p class="text-2xl font-headline font-bold text-orange-400">{stats.totalGoldenStrawberries}</p>
        </div>
    {:else if error}
        <div class="col-span-full bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm">
            Failed to load stats: {error}
        </div>
    {:else}
        {#each Array(7) as _}
            <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl animate-pulse">
                <div class="h-3 w-12 bg-zinc-800 rounded mb-2"></div>
                <div class="h-8 w-20 bg-zinc-800 rounded"></div>
            </div>
        {/each}
    {/if}
</div>
