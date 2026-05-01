<script lang="ts">
  import { onMount } from 'svelte';
  import { GetCollections, GetCollectionCampaignIDs, GetCollectionStats, GetAvailableCampaigns } from '../../wailsjs/go/app/App';
  import CollectionTable from './CollectionTable.svelte';
  import { saveStore } from "../../lib/saveStore.svelte.ts";
  import { getAssetUrl } from "../../lib/assetHelper";
  import IconArrowBack from '~icons/material-symbols/arrow-back';
  import defaultLevelLogo from '../../assets/level_logo_moddedleveldefault.png';

  type Props = {
    id: string;
  }

  let { id }: Props = $props();

  type Collection = {
    id: number,
    userId: number;
    name: string;
  }

  type LevelCollectionStats = {
    campaignId: number;
    campaignName: string;
    lobbiId: number | null;
    lobbyName: string | null;
    levelName:string;
    levelSide: string;
    totalTime: number;
    strawberries: number;
    goldenStrawberries: number;
    hearts: number;
    deaths: number;
    dashes:number;
    coverImgPath: string | null;
    iconImgPath: string | null;
  }

  let collectionName = $state('');
  let campaignIds = $state<number[]>([]);
  let bannerData = $state<string | null>(null);
  let chapterIcons = $state<string[]>([]);
  let loading = $state(true);

  async function loadCollection() {
    if (!saveStore.userId) return;
    loading = true;
    try {
      const collections = await GetCollections(saveStore.userId);
      const col = collections.find(c => c.id.toString() === id);
      if (col) {
        collectionName = col.name;
        campaignIds = await GetCollectionCampaignIDs(parseInt(id));

        if (campaignIds.length > 0) {
            // Fetch stats to get icons
            const stats = await GetCollectionStats(campaignIds, null);

            // Extract unique icons directly (asynchronous)
            const uniqueIconPaths = [...new Set(stats.map(s => s.iconImgPath).filter(Boolean))] as string[];
            const loadedIcons = await Promise.all(
                uniqueIconPaths.map(path => getAssetUrl(path))
            );
            chapterIcons = loadedIcons.filter(Boolean) as string[];

            // Get banner from first campaign if available (as fallback background)
            const allCampaigns = await GetAvailableCampaigns(saveStore.userId);
            const firstCampaign = allCampaigns.find(c => (c.id as any) === campaignIds[0]);
            if (firstCampaign && firstCampaign.coverImgPath) {
                bannerData = await getAssetUrl(firstCampaign.coverImgPath);
            }
        }
      }
    } catch (e) {
      console.error('Failed to load collection:', e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadCollection();
  });

  $effect(() => {
    if (saveStore.userId) {
      loadCollection();
    }
  });
</script>

<div class="space-y-8">
  <div class="relative h-72 w-full rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl group">
    <!-- Background Layer: Blurred Banner or Gradient -->
    {#if bannerData}
      <img
        src={bannerData}
        alt=""
        class="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl scale-110"
      />
    {:else}
       <div class="absolute inset-0 bg-linear-to-br from-primary/20 to-secondary/20 blur-3xl"></div>
    {/if}

    <!-- Icon Grid Layer -->
    <div class="absolute inset-0 p-4 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
        <div class="grid grid-cols-8 md:grid-cols-12 gap-2 h-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_50%,transparent)]">
            {#each [...chapterIcons, ...chapterIcons, ...chapterIcons].slice(0, 48) as icon}
                <div class="aspect-square rounded-lg bg-white/5 border border-white/5 flex items-center justify-center p-1 transform rotate-12 hover:rotate-0 transition-transform">
                    <img src={icon} alt="" class="w-full h-full object-contain" />
                </div>
            {/each}
            {#if chapterIcons.length === 0}
                {#each Array(24) as _}
                    <div class="aspect-square rounded-lg bg-white/5 border border-white/5 flex items-center justify-center p-1 transform rotate-12">
                        <img src={defaultLevelLogo.src} alt="" class="w-full h-full object-contain opacity-20" />
                    </div>
                {/each}
            {/if}
        </div>
    </div>

    <!-- Overlay Gradient -->
    <div class="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
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
        <div>
          <h1 class="text-5xl font-headline font-black text-white tracking-tighter drop-shadow-2xl uppercase">
            {collectionName || 'Loading...'}
          </h1>
          <div class="flex items-center gap-3 mt-1">
            <span class="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">Collection</span>
            <p class="text-white/40 font-medium text-sm">Contains {campaignIds.length} campaigns and {chapterIcons.length} unique chapters</p>
          </div>
        </div>
      </div>
    </div>
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
