<script lang="ts">
  import { GetCollections, GetCollectionCampaignIDs, GetCollectionStats, GetAvailableCampaigns, UpdateCollection } from '../../../wailsjs/go/main/App';
  import CollectionTable from './CollectionTable.svelte';
  import { saveStore } from "../../lib/saveStore.svelte";
  import { getAssetUrl } from "../../lib/assetHelper";
  import IconArrowBack from '~icons/material-symbols/arrow-back';
  import IconEdit from '~icons/material-symbols/edit';
  import IconCheck from '~icons/material-symbols/check';
  import IconClose from '~icons/material-symbols/close';
  import defaultLevelLogo from '../../assets/level_logo_moddedleveldefault.png';

  type Props = {
    id?: string;
  }

  let { id: propId }: Props = $props();
  let id = $derived(propId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null));

  let collectionName = $state('');
  let campaignIds = $state<number[]>([]);
  let bannerData = $state<string | null>(null);
  let chapterIcons = $state<string[]>([]);
  let loading = $state(true);

  // Edit state
  let isEditingName = $state(false);
  let editedName = $state('');

  async function loadCollection() {
    if (!saveStore.userId) return;

    loading = true;
    try {
      const collections = await GetCollections(saveStore.userId);
      const col = collections.find(c => c.id.toString() === id);
      if (col && id) {
        collectionName = col.name;
        editedName = col.name;
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
            const firstCampaign = allCampaigns.find(c => c.id === campaignIds[0]);
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
        <div class="flex-1">
          <div class="flex items-center gap-4">
            {#if isEditingName}
              <input
                bind:value={editedName}
                class="bg-white/10 border border-white/20 rounded-lg px-4 py-1 text-4xl font-headline font-black text-white tracking-tighter uppercase focus:outline-none focus:border-primary w-full max-w-2xl"
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
                class="text-5xl font-headline font-black text-white tracking-tighter drop-shadow-2xl uppercase cursor-pointer hover:text-primary transition-colors"
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
