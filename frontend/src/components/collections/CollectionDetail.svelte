<script lang="ts">
  import { GetCollection, GetCollectionCampaignIDs, GetCollectionStats, GetIndexedAssetAsBase64, UpdateCollection } from '../../../wailsjs/go/main/App';
  import CollectionTable from './CollectionTable.svelte';
  import { saveStore } from "../../lib/saveStore.svelte";
  import { getAssetUrl } from "../../lib/assetHelper";
  import IconArrowBack from '~icons/material-symbols/arrow-back';
  import IconBolt from '~icons/material-symbols/bolt';
  import IconEdit from '~icons/material-symbols/edit';
  import IconFlag from '~icons/material-symbols/flag';
  import IconCheck from '~icons/material-symbols/check';
  import IconClose from '~icons/material-symbols/close';
  import defaultLevelLogo from '../../assets/level_logo_moddedleveldefault.png';
  import deathIcon from '../../assets/interface_SIDEA_deaths_icon.png';
  import heartIcon from '../../assets/interface_SIDEA_heart.png';
  import strawberryIcon from '../../assets/interface_strawberry_icon.png';
  import timerIcon from '../../assets/interface_timer_icon.png';

  type Props = {
    id?: string;
  }

  let { id: propId }: Props = $props();
  let id = $derived(propId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null));

  let collectionName = $state('');
  let campaignIds = $state<number[]>([]);
  let bannerData = $state<string | null>(null);
  let chapterIcons = $state<string[]>([]);
  let chapterCount = $state(0);
  let sideCount = $state(0);
  let totalTime = $state(0);
  let totalBerries = $state(0);
  let maxBerries = $state(0);
  let totalHearts = $state(0);
  let totalDeaths = $state(0);
  let totalDashes = $state(0);
  let loading = $state(true);

  // Edit state
  let isEditingName = $state(false);
  let editedName = $state('');

  const statCards = [
    { key: 'time', label: 'Total Time', image: timerIcon, color: 'text-white', value: () => formatTime(totalTime) },
    { key: 'berries', label: 'Berries', image: strawberryIcon, color: 'text-tertiary', value: () => `${totalBerries}/${maxBerries}` },
    { key: 'hearts', label: 'Hearts', image: heartIcon, color: 'text-purple-400', value: () => totalHearts.toLocaleString() },
    { key: 'deaths', label: 'Deaths', image: deathIcon, color: 'text-primary', value: () => totalDeaths.toLocaleString() },
    { key: 'dashes', label: 'Dashes', icon: IconBolt, color: 'text-secondary', value: () => totalDashes.toLocaleString() },
    { key: 'sides', label: 'Sides', icon: IconFlag, color: 'text-yellow-400', value: () => sideCount.toLocaleString() },
  ];

  async function loadCollection(collectionId: string) {
    if (!saveStore.userId) return;

    loading = true;
    try {
      const col = await GetCollection(parseInt(collectionId));
      collectionName = col.name;
      editedName = col.name;
      campaignIds = await GetCollectionCampaignIDs(parseInt(collectionId));

      if (campaignIds.length > 0) {
          const stats = await GetCollectionStats(campaignIds, saveStore.saveDataId || null);
          const uniqueChapters = new Set(stats.map((stat) => stat.levelName));
          chapterCount = uniqueChapters.size;
          sideCount = stats.length;
          totalTime = stats.reduce((sum, stat) => sum + (stat.totalTime || 0), 0);
          totalBerries = stats.reduce((sum, stat) => sum + (stat.strawberries || 0), 0);
          maxBerries = stats.reduce((sum, stat) => sum + (stat.maxStrawberries || 0), 0);
          totalHearts = stats.reduce((sum, stat) => sum + (stat.hearts || 0), 0);
          totalDeaths = stats.reduce((sum, stat) => sum + (stat.deaths || 0), 0);
          totalDashes = stats.reduce((sum, stat) => sum + (stat.dashes || 0), 0);

          const uniqueIconPaths = [...new Set(stats.map(s => s.iconImgPath).filter(Boolean))] as string[];
          const loadedIcons = await Promise.all(uniqueIconPaths.map(path => loadCollectionAsset(path)));
          chapterIcons = loadedIcons.filter(Boolean) as string[];

          const firstEndscreen = stats.find((stat) => stat.endscreenImgPath)?.endscreenImgPath;
          bannerData = firstEndscreen ? await loadCollectionAsset(firstEndscreen) : null;
      } else {
        bannerData = null;
        chapterIcons = [];
        chapterCount = 0;
        sideCount = 0;
        totalTime = 0;
        totalBerries = 0;
        maxBerries = 0;
        totalHearts = 0;
        totalDeaths = 0;
        totalDashes = 0;
      }
    } catch (e) {
      console.error('Failed to load collection:', e);
    } finally {
      loading = false;
    }
  }

  async function saveNewName() {
    if (!editedName || editedName === collectionName) {
      isEditingName = false;
      return;
    }

    try {
      if (id) {
        await UpdateCollection(parseInt(id), editedName, campaignIds);
        collectionName = editedName;
      }
      isEditingName = false;
    } catch (e) {
      console.error('Failed to update collection name:', e);
    }
  }

  $effect(() => {
    const collectionId = id;
    if (saveStore.userId && collectionId) {
      void loadCollection(collectionId);
    }
  });

  function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async function loadCollectionAsset(path: string | null) {
    if (!path) return null;
    if (!path.includes('/') && !path.includes('\\')) {
      try {
        return await GetIndexedAssetAsBase64(path);
      } catch (error) {
        console.warn(`Could not load indexed collection asset ${path}`, error);
        return null;
      }
    }
    return getAssetUrl(path);
  }
</script>

<div class="space-y-8">
  <div class="relative h-72 w-full rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl group">
    {#if bannerData}
      <img
        src={bannerData}
        alt=""
        class="absolute inset-0 w-full h-full object-cover opacity-60"
      />
    {:else}
       <div class="absolute inset-0 bg-linear-to-br from-primary/20 to-secondary/20 blur-3xl"></div>
    {/if}

    <!-- Icon Grid Layer -->
    <div class="absolute inset-0 p-4 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
        <div class="grid grid-cols-8 md:grid-cols-12 gap-2 h-full overflow-hidden [mask-[linear-gradient(to_bottom,black_50%,transparent)]">
            {#each [...chapterIcons, ...chapterIcons, ...chapterIcons].slice(0, 48) as icon, index (index)}
                <div class="aspect-square rounded-lg bg-white/5 border border-white/5 flex items-center justify-center p-1 transform rotate-12 hover:rotate-0 transition-transform">
                    <img src={icon} alt="" class="w-full h-full object-contain" />
                </div>
            {/each}
            {#if chapterIcons.length === 0}
                {#each [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23] as i (i)}
                    <div class="aspect-square rounded-lg bg-white/5 border border-white/5 flex items-center justify-center p-1 transform rotate-12">
                        <img src={defaultLevelLogo.src} alt="" class="w-full h-full object-contain opacity-20" />
                    </div>
                {/each}
            {/if}
        </div>
    </div>

    <!-- Overlay Gradient -->
    <div class="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/45 to-transparent"></div>
    <div class="absolute inset-0 bg-linear-to-r from-zinc-950/80 via-transparent to-transparent"></div>

    <!-- Content -->
    <div class="absolute inset-0 p-8 flex flex-col justify-end">
      <div class="flex items-center gap-6">
        <a
          href="/collections"
          class="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl transition-all active:scale-95 border border-white/10 group/back"
        >
          <IconArrowBack class="text-2xl group-hover/back:-translate-x-1 transition-transform" />
        </a>
        <div class="flex-1">
          <div class="flex items-center gap-4">
            {#if isEditingName}
              <input
                bind:value={editedName}
                class="bg-white/10 border border-white/20 rounded-lg px-4 py-1 text-4xl font-headline font-black text-white tracking-tighter focus:outline-none focus:border-primary w-full max-w-2xl"
                onkeydown={(e) => e.key === 'Enter' && saveNewName()}
              />
              <div class="flex gap-2">
                <button onclick={saveNewName} class="p-2 rounded-lg bg-primary text-white hover:bg-primary-high transition-colors">
                  <IconCheck />
                </button>
                <button onclick={() => { isEditingName = false; editedName = collectionName; }} class="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                  <IconClose />
                </button>
              </div>
            {:else}
              <h1 
                class="text-5xl font-headline font-black text-white tracking-tighter drop-shadow-2xl cursor-pointer hover:text-primary transition-colors"
                role="button"
                tabindex="0"
                onclick={() => isEditingName = true}
                onkeydown={(e) => e.key === 'Enter' && (isEditingName = true)}
              >
                {collectionName || 'Loading...'}
              </h1>
              <button 
                onclick={() => isEditingName = true}
                class="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <IconEdit />
              </button>
            {/if}
          </div>
          <div class="flex items-center gap-3 mt-1">
            <span class="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">Collection</span>
            <p class="text-white/50 font-medium text-sm">Contains {campaignIds.length} campaigns, {chapterCount} chapters, and {sideCount} sides</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
    {#each statCards as stat (stat.key)}
      <div class="border border-outline-muted bg-card-bg rounded-xl p-4 flex items-center gap-3 min-w-0">
        {#if stat.image}
          <img src={stat.image.src} alt="" class="w-8 h-8 object-contain opacity-85 shrink-0" />
        {:else if stat.icon}
          <stat.icon class="text-3xl shrink-0 {stat.color}" />
        {/if}
        <div class="min-w-0">
          <p class="text-[11px] text-zinc-500 uppercase tracking-widest font-bold truncate">{stat.label}</p>
          <p class="font-pixel text-lg {stat.color} mt-1 truncate">{stat.value()}</p>
        </div>
      </div>
    {/each}
  </div>

  {#if !loading}
    <CollectionTable {campaignIds} />
  {:else}
    <div class="p-12 text-center text-zinc-500 font-montserrat">
        <div class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        Loading collection data...
    </div>
  {/if}
</div>
