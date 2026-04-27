<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { saveStore } from '../../lib/saveStore.svelte';

  interface LevelStats {
    campaignName: string;
    levelName: string;
    levelSide: string;
    totalTime: number;
    strawberries: number;
    goldenStrawberries: number;
    hearts: number;
    deaths: number;
    dashes: number;
  }

  let stats = $state<LevelStats[]>([]);
  let loading = $state(false);

  async function loadStats() {
    if (!saveStore.userId) return;
    loading = true;
    try {
      stats = await invoke<LevelStats[]>('get_collection_stats', { userId: saveStore.userId });
    } catch (e) {
      console.error('Failed to load collection stats:', e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadStats();
  });

  // Re-load when save slot changes
  $effect(() => {
    // Note: In this project, stats seem to be tied to user_id, 
    // but typically they might be tied to a specific save slot.
    // get_collection_stats currently takes user_id.
    if (saveStore.userId) {
      loadStats();
    }
  });

  function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Group stats by campaign
  const campaigns = $derived.by(() => {
    const groups: Record<string, LevelStats[]> = {};
    stats.forEach(s => {
      if (!groups[s.campaignName]) groups[s.campaignName] = [];
      groups[s.campaignName].push(s);
    });
    return Object.entries(groups).map(([name, levels]) => ({
      name,
      levels,
      totals: levels.reduce((acc, l) => ({
        totalTime: acc.totalTime + l.totalTime,
        strawberries: acc.strawberries + l.strawberries,
        goldenStrawberries: acc.goldenStrawberries + l.goldenStrawberries,
        hearts: acc.hearts + l.hearts,
        deaths: acc.deaths + l.deaths,
        dashes: acc.dashes + l.dashes,
      }), { totalTime: 0, strawberries: 0, goldenStrawberries: 0, hearts: 0, deaths: 0, dashes: 0 })
    }));
  });
</script>

<div class="overflow-x-auto rounded-xl border border-outline-muted bg-surface/50 backdrop-blur-xl">
  {#if loading && stats.length === 0}
    <div class="p-8 text-center font-montserrat text-white/50">Loading stats...</div>
  {:else if !loading && campaigns.length === 0}
    <div class="p-8 text-center font-montserrat text-white/50">No data available for this user.</div>
  {:else}
    <table class="w-full border-collapse font-montserrat text-sm text-white">
      <thead>
        <tr class="border-b border-outline-muted bg-surface-high/30">
          <th class="px-4 py-3 text-left font-bold uppercase tracking-wider">Level Name</th>
          <th class="px-4 py-3 text-center font-bold uppercase tracking-wider">Total Time</th>
          <th class="px-4 py-3 text-center font-bold uppercase tracking-wider text-tertiary">Strawberries</th>
          <th class="px-4 py-3 text-center font-bold uppercase tracking-wider text-primary">Goldens</th>
          <th class="px-4 py-3 text-center font-bold uppercase tracking-wider text-secondary">Hearts</th>
          <th class="px-4 py-3 text-center font-bold uppercase tracking-wider text-red-400">Deaths</th>
          <th class="px-4 py-3 text-center font-bold uppercase tracking-wider text-blue-300">Dashes</th>
        </tr>
      </thead>
      <tbody>
        {#each campaigns as campaign}
          <!-- Campaign Header -->
          <tr class="bg-primary/10">
            <td colspan="7" class="px-4 py-2 font-bold text-primary">{campaign.name}</td>
          </tr>
          
          {#each campaign.levels as level}
            <tr class="border-b border-outline-muted/50 hover:bg-white/5 transition-colors">
              <td class="px-4 py-3 text-left">
                <span class="font-medium">{level.levelName}</span>
                <span class="ml-2 text-xs text-white/40 uppercase">{level.levelSide}</span>
              </td>
              <td class="px-4 py-3 text-center font-pixel text-xs">{formatTime(level.totalTime)}</td>
              <td class="px-4 py-3 text-center font-pixel text-xs text-tertiary">{level.strawberries}</td>
              <td class="px-4 py-3 text-center font-pixel text-xs text-primary">{level.goldenStrawberries}</td>
              <td class="px-4 py-3 text-center font-pixel text-xs text-secondary">{level.hearts}</td>
              <td class="px-4 py-3 text-center font-pixel text-xs text-red-400">{level.deaths}</td>
              <td class="px-4 py-3 text-center font-pixel text-xs text-blue-300">{level.dashes}</td>
            </tr>
          {/each}

          <!-- Campaign Totals -->
          <tr class="bg-surface-high/50 font-bold border-b border-outline-muted">
            <td class="px-4 py-2 text-left uppercase text-white/60">Total {campaign.name}</td>
            <td class="px-4 py-2 text-center font-pixel text-xs">{formatTime(campaign.totals.totalTime)}</td>
            <td class="px-4 py-2 text-center font-pixel text-xs text-tertiary">{campaign.totals.strawberries}</td>
            <td class="px-4 py-2 text-center font-pixel text-xs text-primary">{campaign.totals.goldenStrawberries}</td>
            <td class="px-4 py-2 text-center font-pixel text-xs text-secondary">{campaign.totals.hearts}</td>
            <td class="px-4 py-2 text-center font-pixel text-xs text-red-400">{campaign.totals.deaths}</td>
            <td class="px-4 py-2 text-center font-pixel text-xs text-blue-300">{campaign.totals.dashes}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  th {
    font-size: 0.75rem;
  }
</style>
