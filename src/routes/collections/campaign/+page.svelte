<script lang="ts">
    import { page } from "$app/state";
    import { invoke } from "@tauri-apps/api/core";
    import type { Chapter } from "$lib/types/entities";
    import { celesteState } from "$lib/types/celeste_state.svelte";
    import { formatChapterName, formatTime } from "$lib/utils";

    let campaignId = $derived(Number(page.url.searchParams.get("id")));
    let campaignName = $derived(page.url.searchParams.get("name") || "Campaign");

    let chapters = $state<Chapter[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    let campaignStats = $derived({
        deaths: chapters.reduce((acc, c) => acc + c.total_deaths, 0),
        time: chapters.reduce((acc, c) => acc + c.total_time, 0),
        runs: chapters.reduce((acc, c) => acc + c.total_runs, 0)
    });

    $effect(() => {
        if ((celesteState.everestVersion || celesteState.isConnected) && campaignId) {
            loadChapters();
        }
    });

    async function loadChapters() {
        try {
            loading = true;
            chapters = await invoke<Chapter[]>("get_chapters", { campaignId });
        } catch (e) {
            error = e as string;
        } finally {
            loading = false;
        }
    }
</script>

<div class="p-8 md:p-12 space-y-8">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="flex items-center gap-4">
            <a href="/collections" class="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400">
                <span class="material-symbols-outlined">arrow_back</span>
            </a>
            <div>
                <h1 class="text-4xl font-headline font-black text-white tracking-tighter">{campaignName}</h1>
                <p class="text-zinc-400">Chapters in this campaign</p>
            </div>
        </div>

        {#if !loading && !error}
            <div class="flex gap-8 px-8 py-4 bg-zinc-900 border border-white/5 rounded-2xl">
                <div class="space-y-1">
                    <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Deaths</span>
                    <p class="text-white font-black text-xl">{campaignStats.deaths}</p>
                </div>
                <div class="space-y-1">
                    <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Time</span>
                    <p class="text-white font-black text-xl">{formatTime(campaignStats.time)}</p>
                </div>
                <div class="space-y-1">
                    <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Runs</span>
                    <p class="text-white font-black text-xl">{campaignStats.runs}</p>
                </div>
            </div>
        {/if}
    </div>

    {#if loading}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each Array(6) as _}
                <div class="h-24 bg-zinc-900/50 animate-pulse rounded-xl border border-white/5"></div>
            {/each}
        </div>
    {:else if error}
        <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400">
            {error}
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each chapters as chapter}
                <a 
                    href="/collections/campaign/chapter?id={chapter.id}&sid={encodeURIComponent(chapter.sid)}&name={encodeURIComponent(chapter.name)}&mode={chapter.mode}"
                    class="group flex flex-col p-6 bg-zinc-900 border border-white/5 rounded-xl hover:border-(--hub-primary)/40 transition-all gap-4"
                >
                    <div class="flex items-center justify-between">
                        <div class="space-y-1">
                            <h3 class="text-lg font-bold text-white group-hover:text-(--hub-primary) transition-colors">
                                {formatChapterName(chapter.name, chapter.sid)}
                            </h3>
                            <p class="text-xs text-zinc-500 font-mono tracking-widest uppercase">{chapter.mode}</p>
                        </div>
                        <span class="material-symbols-outlined text-zinc-700 group-hover:text-(--hub-primary) transition-colors">chevron_right</span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div class="space-y-0.5">
                            <span class="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Deaths</span>
                            <p class="text-white text-sm font-bold">{chapter.total_deaths}</p>
                        </div>
                        <div class="space-y-0.5">
                            <span class="text-[9px] uppercase font-bold text-zinc-500 tracking-widest">Time</span>
                            <p class="text-white text-sm font-bold">{formatTime(chapter.total_time)}</p>
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</div>
