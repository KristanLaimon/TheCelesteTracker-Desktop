<script lang="ts">
  /**
   * CollectionList Component
   * Handles the display, creation, editing, and deletion of user map collections.
   */
  import { 
    GetCollections, 
    GetAvailableCampaigns, 
    CreateCollection, 
    UpdateCollection, 
    DeleteCollection, 
    GetCollectionCampaignIDs 
  } from '../../../../wailsjs/go/main/App';
  import { saveStore } from '../../../lib/saveStore.svelte';
  
  // Sub-components
  import CollectionCard from './CollectionCard.svelte';
  import AddCollectionCard from './AddCollectionCard.svelte';
  import CollectionModal from './CollectionModal.svelte';

  // Types
  interface Collection {
    id: number;
    userId: number;
    name: string;
  }

  interface CampaignItem {
    id: number;
    campaignNameId: string;
  }

  // Reactive State
  let collections = $state<Collection[]>([]);
  let availableCampaigns = $state<CampaignItem[]>([]);
  let showModal = $state(false);

  // Modal Form State
  let editingId = $state<number | null>(null);
  let collectionName = $state('');
  let selectedCampaignIds = $state<number[]>([]);

  /**
   * Loads collections and available campaigns from the backend
   */
  async function loadData() {
    if (!saveStore.userId) return;

    try {
      const [fetchedCollections, fetchedCampaigns] = await Promise.all([
        GetCollections(saveStore.userId),
        GetAvailableCampaigns(saveStore.userId)
      ]);
      collections = fetchedCollections || [];
      availableCampaigns = fetchedCampaigns || [];
    } catch (e) {
      console.error('Failed to load collections:', e);
    }
  }

  // Load data when userId is available
  $effect(() => {
    if (saveStore.userId) {
      loadData();
    }
  });

  /**
   * Saves a new or existing collection
   */
  async function handleSave(name: string, selectedIds: number[]) {
    if (!saveStore.userId || !name) return;

    try {
      if (editingId) {
        await UpdateCollection(editingId, name, selectedIds);
      } else {
        await CreateCollection(saveStore.userId, name, selectedIds);
      }
      showModal = false;
      await loadData();
    } catch (e) {
      console.error('Failed to save collection:', e);
    }
  }

  /**
   * Deletes a collection after confirmation
   */
  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    try {
      await DeleteCollection(id);
      await loadData();
    } catch (e) {
      console.error('Failed to delete collection:', e);
    }
  }

  /**
   * Opens the modal in edit mode
   */
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

  /**
   * Opens the modal in add mode
   */
  function openAdd() {
    editingId = null;
    collectionName = '';
    selectedCampaignIds = [];
    showModal = true;
  }

  /**
   * Closes the modal
   */
  function handleClose() {
    showModal = false;
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Create New Collection Button -->
  <AddCollectionCard onclick={openAdd} />

  <!-- Existing Collections Grid -->
  {#each collections as col (col.id)}
    <CollectionCard 
      collection={col} 
      onEdit={openEdit} 
      onDelete={handleDelete} 
    />
  {/each}
</div>

<!-- Add/Edit Collection Modal -->
<CollectionModal
  show={showModal}
  {editingId}
  initialName={collectionName}
  initialSelectedIds={selectedCampaignIds}
  {availableCampaigns}
  onSave={handleSave}
  onClose={handleClose}
/>
