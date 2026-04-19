<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import type { Campaign } from "$lib/types/entities";
    import { celesteState } from "$lib/types/celeste_state.svelte";
    import { formatTime } from "$lib/utils";

    let campaigns = $state<Campaign[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    $effect(() => {
        if (celesteState.everestVersion || celesteState.isConnected) {
            loadCampaigns();
        }
    });

    async function loadCampaigns() {
        try {
            loading = true;
            campaigns = await invoke<Campaign[]>("get_campaigns");
        } catch (e) {
            error = e as string;
        } finally {
            loading = false;
        }
    }
</script>

<div class="p-8 md:p-12 space-y-8">
    <div>
        <h1 class="text-4xl font-headline font-black text-white tracking-tighter">Collections</h1>
        <p class="text-zinc-400">Browse your campaigns and chapters</p>
    </div>

    {#if !celesteState.everestVersion && !celesteState.isConnected}
        <div class="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl text-center">
            <p class="text-zinc-500">Waiting for Celeste database path...</p>
        </div>
    {:else if loading}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each Array(3) as _}
                <div class="h-48 bg-zinc-900/50 animate-pulse rounded-2xl border border-white/5"></div>
            {/each}
        </div>
    {:else if error}
        <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400">
            {error}
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each campaigns as campaign}
                <a 
                    href="/collections/campaign?id={campaign.id}&name={encodeURIComponent(campaign.name)}"
                    class="group relative overflow-hidden bg-zinc-900 border border-white/5 p-8 rounded-2xl hover:border-(--hub-primary)/40 transition-all flex flex-col justify-between"
                >
                    <div class="absolute inset-0 bg-gradient-to-br from-(--hub-primary)/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="relative z-10 space-y-4">
                        <div class="size-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-(--hub-primary) transition-colors">
                            <span class="material-symbols-outlined text-3xl">folder</span>
                        </div>
                        <h2 class="text-2xl font-headline font-bold text-white group-hover:text-(--hub-primary) transition-colors">{campaign.name}</h2>
                    </div>
                    
                    <div class="relative z-10 mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                        <div class="space-y-1">
                            <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Deaths</span>
                            <p class="text-white font-bold">{campaign.total_deaths}</p>
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Time Spent</span>
                            <p class="text-white font-bold">{formatTime(campaign.total_time)}</p>
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</div>
