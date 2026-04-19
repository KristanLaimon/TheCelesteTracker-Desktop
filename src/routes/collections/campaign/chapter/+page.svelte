<script lang="ts">
    import { page } from "$app/state";
    import { invoke } from "@tauri-apps/api/core";
    import type { Run } from "$lib/types/entities";
    import { celesteState } from "$lib/types/celeste_state.svelte";
    import { syncStore } from "$lib/logic/sync_store.svelte";
    import { formatChapterName, formatTime } from "$lib/utils";

    let chapterId = $derived(Number(page.url.searchParams.get("id")));
    let chapterSid = $derived(page.url.searchParams.get("sid") || "");
    let chapterName = $derived(page.url.searchParams.get("name") || "");
    let chapterMode = $derived(page.url.searchParams.get("mode"));

    let runs = $state<Run[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    let displayRuns = $derived.by(() => {
        let allRuns = [...runs];
        if (syncStore.currentRun && syncStore.isChapterActive(chapterSid, chapterMode || "")) {
            // Check if already in list to avoid duplicates if backend updated
            if (!allRuns.some(r => r.id === syncStore.currentRun?.id)) {
                allRuns = [syncStore.currentRun, ...allRuns];
            }
        }
        return allRuns;
    });

    let stats = $derived({
        bestTime: runs.filter(r => r.completion_time).sort((a, b) => a.time_ticks - b.time_ticks)[0],
        leastDeaths: runs.filter(r => r.completion_time).sort((a, b) => a.deaths - b.deaths)[0],
        totalRuns: runs.length,
        hasGolden: runs.some(r => r.golden)
    });

    $effect(() => {
        if ((celesteState.everestVersion || celesteState.isConnected) && chapterId) {
            loadRuns();
        }
    });

    async function loadRuns() {
        try {
            loading = true;
            runs = await invoke<Run[]>("get_runs", { chapterId });
        } catch (e) {
            error = e as string;
        } finally {
            loading = false;
        }
    }
</script>

<div class="p-8 md:p-12 space-y-8">
    <div class="flex items-center gap-4">
        <button onclick={() => history.back()} class="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400">
            <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
            <h1 class="text-4xl font-headline font-black text-white tracking-tighter">
                {formatChapterName(chapterName, chapterSid)}
            </h1>
            <p class="text-zinc-400 font-mono tracking-widest uppercase text-sm">{chapterMode} • {chapterSid}</p>
        </div>
    </div>

    {#if loading}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {#each Array(4) as _}
                <div class="h-32 bg-zinc-900/50 animate-pulse rounded-2xl border border-white/5"></div>
            {/each}
        </div>
    {:else if error}
        <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400">
            {error}
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-zinc-900 p-8 rounded-2xl border border-white/5 space-y-2">
                <p class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Personal Best</p>
                <p class="text-4xl font-black text-white">
                    {stats.bestTime ? formatTime(stats.bestTime.time_ticks) : "--:--:---"}
                </p>
            </div>
            <div class="bg-zinc-900 p-8 rounded-2xl border border-white/5 space-y-2">
                <p class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Least Deaths</p>
                <p class="text-4xl font-black text-[#ff788c]">
                    {stats.leastDeaths ? stats.leastDeaths.deaths : "--"}
                </p>
            </div>
            <div class="bg-zinc-900 p-8 rounded-2xl border border-white/5 space-y-2">
                <p class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Runs</p>
                <p class="text-4xl font-black text-[#67d8d2]">{stats.totalRuns}</p>
            </div>
            <div class="bg-zinc-900 p-8 rounded-2xl border border-white/5 space-y-2">
                <p class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Golden</p>
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined {stats.hasGolden ? 'text-yellow-500' : 'text-zinc-700'} text-4xl">workspace_premium</span>
                    <p class="{stats.hasGolden ? 'text-yellow-500' : 'text-zinc-700'} font-bold">
                        {stats.hasGolden ? 'COLLECTED' : 'LOCKED'}
                    </p>
                </div>
            </div>
        </div>

        <div class="bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden">
            <div class="p-6 border-b border-white/5">
                <h2 class="text-xl font-headline font-bold text-white">Run History</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-zinc-500 text-xs font-bold uppercase tracking-widest border-b border-white/5">
                            <th class="px-8 py-4">Date</th>
                            <th class="px-8 py-4">Time</th>
                            <th class="px-8 py-4">Deaths</th>
                            <th class="px-8 py-4">Strawberries</th>
                            <th class="px-8 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        {#each displayRuns as run}
                            <tr class="group hover:bg-white/5 transition-colors {run.status === 'Active' ? 'bg-hub-primary/5 border-l-4 border-hub-primary' : ''}">
                                <td class="px-8 py-4 text-zinc-400 text-sm">
                                    {run.status === 'Active' ? 'NOW' : (run.completion_time ? new Date(run.completion_time).toLocaleDateString() : 'In Progress')}
                                </td>
                                <td class="px-8 py-4 font-mono text-white">
                                    {formatTime(run.time_ticks)}
                                </td>
                                <td class="px-8 py-4 text-[#ff788c] font-bold">
                                    <div class="flex flex-col">
                                        <span>{run.deaths}</span>
                                        {#if run.status === 'Active'}
                                            <span class="text-[10px] text-zinc-500 uppercase">Room: {run.room_deaths}</span>
                                        {/if}
                                    </div>
                                </td>
                                <td class="px-8 py-4 text-[#ffc971]">
                                    🍓 {run.strawberries}
                                </td>
                                <td class="px-8 py-4">
                                    {#if run.golden}
                                        <span class="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold rounded border border-yellow-500/20">GOLDEN</span>
                                    {:else if run.status === 'Active'}
                                        <span class="px-2 py-1 bg-hub-primary/10 text-hub-primary text-[10px] font-bold rounded border border-hub-primary/20 animate-pulse">ACTIVE</span>
                                    {:else if run.completion_time}
                                        <span class="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded border border-green-500/20">FINISHED</span>
                                    {:else}
                                        <span class="px-2 py-1 bg-zinc-500/10 text-zinc-500 text-[10px] font-bold rounded border border-zinc-500/20">ABANDONED</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                {#if runs.length === 0}
                    <div class="p-12 text-center text-zinc-600">
                        <p>No run history found for this chapter.</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
