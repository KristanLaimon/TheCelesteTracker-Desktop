<script lang="ts">
  import { onMount } from 'svelte';
  import { GetCollections, GetAvailableCampaigns, CreateCollection, UpdateCollection, DeleteCollection, GetCollectionCampaignIDs } from '../../wailsjs/go/app/App';
  import { saveStore } from '../../lib/saveStore.svelte';
  import IconPlus from '~icons/material-symbols/add';
  import IconFolder from '~icons/material-symbols/folder';
  import IconDelete from '~icons/material-symbols/delete';
  import IconEdit from '~icons/material-symbols/edit';

  interface Collection {
    id: number;
    userId: number;
    name: string;
  }

  interface CampaignItem {
    id: number;
    campaignNameId: string;
  }

  let collections = $state<Collection[]>([]);
  let availableCampaigns = $state<CampaignItem[]>([]);
  let loading = $state(true);
  let showModal = $state(false);

  // Form state
  let editingId = $state<number | null>(null);
  let collectionName = $state('');
  let selectedCampaignIds = $state<number[]>([]);

  async function loadData() {
    console.log('[Collections] loadData called, userId:', saveStore.userId);
    if (!saveStore.userId) return;
    loading = true;
    try {
      console.log('[Collections] fetching from backend...');
      const [fetchedCollections, fetchedCampaigns] = await Promise.all([
        GetCollections(saveStore.userId),
        GetAvailableCampaigns(saveStore.userId)
      ]);
      console.log('[Collections] received collections:', fetchedCollections);
      collections = fetchedCollections;
      availableCampaigns = fetchedCampaigns;
    } catch (e) {
      console.error('Failed to load collections:', e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  $effect(() => {
    if (saveStore.userId) {
      loadData();
    }
  });

  async function handleSave() {
    if (!saveStore.userId || !collectionName) return;

    try {
      if (editingId) {
        await UpdateCollection(editingId, collectionName, selectedCampaignIds);
      } else {
        await CreateCollection(saveStore.userId, collectionName, selectedCampaignIds);
      }
      showModal = false;
      await loadData();
    } catch (e) {
      console.error('Failed to save collection:', e);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    try {
      await DeleteCollection(id);
      await loadData();
    } catch (e) {
      console.error('Failed to delete collection:', e);
    }
  }

  async function openEdit(col: Collection) {
    editingId = col.id;
    collectionName = col.name;
    try {
      selectedCampaignIds = await GetCollectionCampaignIDs(col.id);
      showModal = true;
    } catch (e) {
      console.error('Failed to load collection details:', e);
    }
  }

  function openAdd() {
    editingId = null;
    collectionName = '';
    selectedCampaignIds = [];
    showModal = true;
  }

  function toggleCampaign(id: number) {
    if (selectedCampaignIds.includes(id)) {
      selectedCampaignIds = selectedCampaignIds.filter(i => i !== id);
    } else {
      selectedCampaignIds = [...selectedCampaignIds, id];
    }
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const newIds = [...selectedCampaignIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    selectedCampaignIds = newIds;
  }

  function moveDown(index: number) {
    if (index === selectedCampaignIds.length - 1) return;
    const newIds = [...selectedCampaignIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    selectedCampaignIds = newIds;
  }

  function getCampaignName(id: number) {
    return availableCampaigns.find(c => c.id === id)?.campaignNameId || 'Unknown';
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Add Card -->
  <button
    onclick={openAdd}
    class="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-outline-muted hover:border-primary hover:bg-primary/5 transition-all group h-48"
  >
    <IconPlus class="text-4xl text-zinc-500 group-hover:text-primary mb-2 transition-colors" />
    <span class="font-bold text-zinc-400 group-hover:text-white transition-colors">Create Collection</span>
  </button>

  {#each collections as col}
    <div class="relative group h-48 rounded-2xl bg-surface/40 border border-outline-muted overflow-hidden hover:border-primary/50 hover:bg-surface-high/60 transition-all">
      <a href={`/collections/${col.id}`} class="flex flex-col h-full p-6">
        <IconFolder class="text-4xl text-orange-400 mb-4" />
        <h3 class="text-xl font-bold text-white mb-1">{col.name}</h3>
        <p class="text-zinc-500 text-sm">Custom Level Set</p>
      </a>

      <!-- Actions -->
      <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onclick={() => openEdit(col)}
          class="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <IconEdit />
        </button>
        <button
          onclick={() => handleDelete(col.id)}
          class="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors"
        >
          <IconDelete />
        </button>
      </div>
    </div>
  {/each}
</div>

{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div class="bg-surface-high border border-outline-muted rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
      <div class="p-6 border-b border-outline-muted flex justify-between items-center">
        <h2 class="text-2xl font-bold text-white">{editingId ? 'Edit' : 'New'} Collection</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-outline-muted">
        <!-- Selection Side -->
        <div class="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div>
            <label for="collection-name" class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Collection Name</label>
            <input
              id="collection-name"
              bind:value={collectionName}
              placeholder="e.g. My Favorites"
              class="w-full bg-surface border border-outline-muted rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <div class="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Available Campaigns</div>
            <div class="space-y-2">
              {#each availableCampaigns as camp}
                <button
                  onclick={() => toggleCampaign(camp.id)}
                  class="w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left {selectedCampaignIds.includes(camp.id) ? 'bg-primary/20 border-primary text-white' : 'bg-surface border-outline-muted text-zinc-400 hover:bg-white/5'}"
                >
                  <div class="w-5 h-5 rounded border flex items-center justify-center {selectedCampaignIds.includes(camp.id) ? 'bg-primary border-primary' : 'border-zinc-600'}">
                    {#if selectedCampaignIds.includes(camp.id)}
                      <span class="text-[10px] font-bold">✓</span>
                    {/if}
                  </div>
                  <span class="font-medium text-sm truncate">{camp.campaignNameId}</span>
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Order Side -->
        <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-surface/30">
          <div class="block text-xs font-bold uppercase tracking-wider text-zinc-500">Selected & Order</div>
          {#if selectedCampaignIds.length === 0}
            <p class="text-zinc-600 text-sm italic mt-8 text-center">No campaigns selected</p>
          {:else}
            <div class="space-y-2">
              {#each selectedCampaignIds as id, index}
                <div class="flex items-center gap-2 p-3 bg-surface rounded-lg border border-outline-muted">
                  <span class="text-zinc-500 font-bold text-xs w-4">{index + 1}.</span>
                  <span class="flex-1 text-sm font-medium truncate">{getCampaignName(id)}</span>
                  <div class="flex flex-col gap-1">
                    <button onclick={() => moveUp(index)} class="p-1 hover:text-primary transition-colors"><IconPlus class="rotate-180 text-xs" /></button>
                    <button onclick={() => moveDown(index)} class="p-1 hover:text-primary transition-colors"><IconPlus class="text-xs" /></button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="p-6 bg-surface/50 flex gap-3 justify-end border-t border-outline-muted">
        <button
          onclick={() => showModal = false}
          class="px-6 py-2 rounded-lg font-bold text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={handleSave}
          class="px-8 py-2 rounded-lg font-bold bg-primary text-white hover:bg-primary-high transition-colors shadow-lg shadow-primary/20"
        >
          Save Collection
        </button>
      </div>
    </div>
  </div>
{/if}
