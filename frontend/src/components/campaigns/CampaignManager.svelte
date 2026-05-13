<script lang="ts">
  import { GetCampaigns, GetLobbies, CreateCampaign, UpdateCampaign, DeleteCampaign } from '../../../wailsjs/go/main/App';
  import { saveStore } from '../../lib/saveStore.svelte';
  import { getAssetUrl } from '../../lib/assetHelper';
  import type { src } from '../../../wailsjs/go/models';
  import IconPlus from '~icons/material-symbols/add';
  import IconEdit from '~icons/material-symbols/edit';
  import IconDelete from '~icons/material-symbols/delete';
  import IconFolder from '~icons/material-symbols/folder';

  type Campaign = src.Campaign & {
    coverUrl?: string | null;
  };

  type Lobby = src.Lobby;

  let campaigns = $state<Campaign[]>([]);
  let lobbies = $state<Lobby[]>([]);
  let loading = $state(true);
  let showModal = $state(false);

  // Form state
  let editingId = $state<number | null>(null);
  let campaignNameId = $state('');
  let selectedLobbyId = $state<number | null>(null);
  let coverImgPath = $state('');

  async function loadData() {
    if (!saveStore.saveDataId) return;

    if (typeof window !== 'undefined' && (!window.go || !window.go.main)) {
      console.warn('[CampaignManager] Wails runtime not detected. Skipping backend fetch.');
      loading = false;
      return;
    }

    loading = true;
    try {
      const [fetchedCampaigns, fetchedLobbies] = await Promise.all([
        GetCampaigns(saveStore.saveDataId),
        GetLobbies(saveStore.saveDataId)
      ]);

      lobbies = fetchedLobbies;

      // Load cover images
      campaigns = await Promise.all(fetchedCampaigns.map(async (c) => ({
        ...c,
        coverUrl: c.coverImgPath ? await getAssetUrl(c.coverImgPath) : null
      })));
    } catch (e) {
      console.error('Failed to load campaigns:', e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (saveStore.saveDataId) {
      loadData();
    }
  });

  async function handleSave() {
    if (!campaignNameId) return;

    try {
      if (editingId) {
        await UpdateCampaign(editingId, campaignNameId, selectedLobbyId, coverImgPath || null);
      } else {
        await CreateCampaign(saveStore.saveDataId, campaignNameId, selectedLobbyId, coverImgPath || null);
      }
      showModal = false;
      await loadData();
    } catch (e) {
      console.error('Failed to save campaign:', e);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await DeleteCampaign(id);
      await loadData();
    } catch (e) {
      console.error('Failed to delete campaign:', e);
    }
  }

  function openAdd() {
    editingId = null;
    campaignNameId = '';
    selectedLobbyId = null;
    coverImgPath = '';
    showModal = true;
  }

  function openEdit(c: Campaign) {
    editingId = c.id;
    campaignNameId = c.campaignNameId;
    selectedLobbyId = c.lobbyId ?? null;
    coverImgPath = c.coverImgPath || '';
    showModal = true;
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-white">Campaigns</h2>
    <button
      onclick={openAdd}
      class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-high transition-colors"
    >
      <IconPlus /> Add Campaign
    </button>
  </div>

  {#if loading}
    <div class="text-center py-12 text-zinc-500">Loading campaigns...</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each campaigns as c (c.id)}
        <div class="group relative bg-surface/40 border border-outline-muted rounded-2xl overflow-hidden hover:border-primary/50 transition-all">
          <div class="h-32 bg-zinc-900 relative">
            {#if c.coverUrl}
              <img src={c.coverUrl} alt={c.campaignNameId} class="w-full h-full object-cover opacity-60" />
            {:else}
              <div class="w-full h-full flex items-center justify-center opacity-20">
                <IconFolder class="text-4xl" />
              </div>
            {/if}
            <div class="absolute inset-0 bg-linear-to-t from-black/80 to-transparent"></div>
            <div class="absolute bottom-3 left-4">
              <h3 class="text-lg font-bold text-white">{c.campaignNameId}</h3>
              {#if c.lobbyId}
                <p class="text-xs text-zinc-400">Lobby: {lobbies.find(l => l.id === c.lobbyId)?.name || 'Unknown'}</p>
              {/if}
            </div>
          </div>

          <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick={() => openEdit(c)} class="p-2 bg-black/60 text-white rounded-lg hover:bg-primary transition-colors">
              <IconEdit class="text-sm" />
            </button>
            <button onclick={() => handleDelete(c.id)} class="p-2 bg-black/60 text-white rounded-lg hover:bg-red-500 transition-colors">
              <IconDelete class="text-sm" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div class="bg-surface-high border border-outline-muted rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
      <div class="p-6 border-b border-outline-muted">
        <h2 class="text-xl font-bold text-white">{editingId ? 'Edit' : 'New'} Campaign</h2>
      </div>

      <div class="p-6 space-y-4">
        <div>
          <label for="campaign-id" class="block text-xs font-bold uppercase text-zinc-500 mb-1">Campaign ID (Internal)</label>
          <input
            id="campaign-id"
            bind:value={campaignNameId}
            placeholder="e.g. StrawberryJam2023/1-Beginner"
            class="w-full bg-surface border border-outline-muted rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label for="lobby-select" class="block text-xs font-bold uppercase text-zinc-500 mb-1">Lobby Group (Optional)</label>
          <select
            id="lobby-select"
            bind:value={selectedLobbyId}
            class="w-full bg-surface border border-outline-muted rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value={null}>None / Individual</option>
            {#each lobbies as l (l.id)}
              <option value={l.id}>{l.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="cover-path" class="block text-xs font-bold uppercase text-zinc-500 mb-1">Cover Image Path</label>
          <input
            id="cover-path"
            bind:value={coverImgPath}
            placeholder="C:\Path\To\cover.png"
            class="w-full bg-surface border border-outline-muted rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div class="p-6 bg-surface/50 flex gap-3 justify-end border-t border-outline-muted">
        <button onclick={() => showModal = false} class="px-4 py-2 text-zinc-400 hover:text-white transition-colors">Cancel</button>
        <button onclick={handleSave} class="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-high transition-colors">Save</button>
      </div>
    </div>
  </div>
{/if}
