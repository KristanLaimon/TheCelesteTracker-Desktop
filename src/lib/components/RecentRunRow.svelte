<script lang="ts">
    import FilterHdr from "~icons/material-symbols/filter-hdr";
    import type { RecentRun } from "$lib/logic/sync_store.svelte";

    let { run }: { run: RecentRun } = $props();
</script>

<tr class="hover:bg-white/5 transition-colors group">
    <td class="px-6 py-4">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded bg-hub-primary/10 flex items-center justify-center text-hub-primary">
                <FilterHdr class="text-lg" />
            </div>
            <span class="font-bold text-zinc-200">{run.chapter_name} ({run.mode})</span>
        </div>
    </td>
    <td class="px-6 py-4">
        <span class="px-2 py-1 rounded text-[10px] font-bold bg-hub-secondary/10 text-hub-secondary uppercase tracking-tighter">
            {run.campaign_name === 'Celeste' ? 'Vanilla' : 'Modded'}
        </span>
    </td>
    <td class="px-6 py-4 font-mono text-zinc-400">{run.completion_time || '--:--:--'}</td>
    <td class="px-6 py-4 text-zinc-400">{run.deaths}</td>
    <td class="px-6 py-4 text-right">
        {#if run.golden}
            <span class="text-yellow-400 font-bold text-sm">GOLDEN</span>
        {:else}
            <span class="text-zinc-500 font-bold text-sm">-</span>
        {/if}
    </td>
</tr>
