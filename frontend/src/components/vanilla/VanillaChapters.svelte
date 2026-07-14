<script lang="ts">
  import { GetCampaigns, GetCollectionStats } from '../../../wailsjs/go/main/App';
  import CollectionTable from '../collections/CollectionTable.svelte';
  import { saveStore } from '../../lib/saveStore.svelte';
  import deathIcon from '../../assets/interface_SIDEA_deaths_icon.png';
  import heartIcon from '../../assets/interface_SIDEA_heart.png';
  import strawberryIcon from '../../assets/interface_strawberry_icon.png';
  import timerIcon from '../../assets/interface_timer_icon.png';
  import IconBolt from '~icons/material-symbols/bolt';
  import IconFlag from '~icons/material-symbols/flag';
  import IconMap from '~icons/material-symbols/map';

  let campaignIds = $state<number[]>([]);
  let chapterCount = $state(0);
  let sideCount = $state(0);
  let totalTime = $state(0);
  let totalBerries = $state(0);
  let maxBerries = $state(0);
  let totalHearts = $state(0);
  let maxHearts = $state(0);
  let totalDeaths = $state(0);
  let totalDashes = $state(0);
  let loading = $state(true);
  let errorMessage = $state('');

  const statCards = [
    { key: 'time', label: 'Total Time', image: timerIcon, color: 'text-white', value: () => formatTime(totalTime) },
    { key: 'berries', label: 'Berries', image: strawberryIcon, color: 'text-tertiary', value: () => `${totalBerries}/${maxBerries}` },
    { key: 'hearts', label: 'Hearts', image: heartIcon, color: 'text-purple-400', value: () => `${totalHearts}/${maxHearts}` },
    { key: 'deaths', label: 'Deaths', image: deathIcon, color: 'text-primary', value: () => totalDeaths.toLocaleString() },
    { key: 'dashes', label: 'Dashes', icon: IconBolt, color: 'text-secondary', value: () => totalDashes.toLocaleString() },
    { key: 'sides', label: 'Sides', icon: IconFlag, color: 'text-yellow-400', value: () => sideCount.toLocaleString() },
  ];

  $effect(() => {
    if (saveStore.saveDataId) {
      void loadVanillaCampaign();
    }
  });

  async function loadVanillaCampaign() {
    loading = true;
    errorMessage = '';

    try {
      const campaigns = await GetCampaigns(saveStore.saveDataId);
      const vanillaCampaign = campaigns.find((campaign) => isVanillaCampaign(campaign.campaignNameId));

      if (!vanillaCampaign) {
        campaignIds = [];
        resetTotals();
        errorMessage = 'Celeste campaign data was not found for this save.';
        return;
      }

      campaignIds = [vanillaCampaign.id];
      await loadTotals();
    } catch (error) {
      console.error('Failed to load vanilla campaign:', error);
      campaignIds = [];
      resetTotals();
      errorMessage = 'Vanilla chapters could not be loaded.';
    } finally {
      loading = false;
    }
  }

  async function loadTotals() {
    if (!campaignIds.length) {
      resetTotals();
      return;
    }

    const stats = await GetCollectionStats(campaignIds, saveStore.saveDataId || null);
    const uniqueChapters = new Set(stats.map((stat) => stat.levelName));

    chapterCount = uniqueChapters.size;
    sideCount = stats.length;
    totalTime = stats.reduce((sum, stat) => sum + (stat.totalTime || 0), 0);
    totalBerries = stats.reduce((sum, stat) => sum + (stat.strawberries || 0), 0);
    maxBerries = stats.reduce((sum, stat) => sum + (stat.maxStrawberries || 0), 0);
    totalHearts = stats.reduce((sum, stat) => sum + (stat.hearts || 0), 0);
    maxHearts = stats.reduce((sum, stat) => sum + (stat.maxHearts || 0), 0);
    totalDeaths = stats.reduce((sum, stat) => sum + (stat.deaths || 0), 0);
    totalDashes = stats.reduce((sum, stat) => sum + (stat.dashes || 0), 0);
  }

  function isVanillaCampaign(campaignNameId: string) {
    return campaignNameId.trim().toLowerCase() === 'celeste';
  }

  function resetTotals() {
    chapterCount = 0;
    sideCount = 0;
    totalTime = 0;
    totalBerries = 0;
    maxBerries = 0;
    totalHearts = 0;
    maxHearts = 0;
    totalDeaths = 0;
    totalDashes = 0;
  }

  function formatTime(ms: number) {
    if (!ms) return '0:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <p class="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-secondary">
        <IconMap class="text-lg" />
        Predefined collection
      </p>
      <h2 class="mt-2 text-3xl font-headline font-black tracking-tight text-white md:text-4xl">
        Vanilla <span class="text-secondary">Chapters</span>
      </h2>
      <p class="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500 md:text-base">
        Celeste campaign progress across every chapter and side.
      </p>
    </div>
    <div class="grid grid-cols-2 gap-2 text-right text-xs font-bold uppercase tracking-widest text-zinc-500 sm:flex sm:gap-5">
      <div><span class="block font-pixel text-lg text-white">{chapterCount}</span>Chapters</div>
      <div><span class="block font-pixel text-lg text-white">{sideCount}</span>Sides</div>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
    {#each statCards as stat (stat.key)}
      <div class="flex min-w-0 items-center gap-3 rounded-xl border border-outline-muted bg-card-bg p-4">
        {#if stat.image}
          <img src={stat.image.src} alt="" class="h-8 w-8 shrink-0 object-contain opacity-85" />
        {:else if stat.icon}
          <stat.icon class="shrink-0 text-3xl {stat.color}" />
        {/if}
        <div class="min-w-0">
          <p class="truncate text-[11px] font-bold uppercase tracking-widest text-zinc-500">{stat.label}</p>
          <p class="mt-1 truncate font-pixel text-lg {stat.color}">{stat.value()}</p>
        </div>
      </div>
    {/each}
  </div>

  {#if loading}
    <div class="rounded-xl border border-outline-muted bg-card-bg p-8 text-center font-medium text-zinc-500">
      <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-secondary/30 border-t-secondary"></div>
      Loading vanilla chapters...
    </div>
  {:else if errorMessage}
    <div class="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center font-medium text-red-200">
      {errorMessage}
    </div>
  {:else}
    <CollectionTable {campaignIds} onStatsChanged={loadTotals} />
  {/if}
</div>
