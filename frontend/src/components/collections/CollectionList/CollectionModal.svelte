<script lang="ts">
  import IconPlus from '~icons/material-symbols/add';
  import IconDelete from '~icons/material-symbols/delete';
  import IconClose from '~icons/material-symbols/close';
  import IconDragIndicator from '~icons/material-symbols/drag-indicator';

  interface CampaignItem {
    id: number;
    campaignNameId: string;
  }

  interface Props {
    show: boolean;
    editingId: number | null;
    initialName: string;
    initialSelectedIds: number[];
    availableCampaigns: CampaignItem[];
    onSave: (name: string, selectedIds: number[]) => Promise<void>;
    onClose: () => void;
  }

  let { 
    show, 
    editingId, 
    initialName, 
    initialSelectedIds, 
    availableCampaigns, 
    onSave, 
    onClose 
  }: Props = $props();

  // Internal state for the form
  let collectionName = $state(initialName);
  let selectedCampaignIds = $state<number[]>([...initialSelectedIds]);

  // Sync internal state when props change (when modal opens)
  $effect(() => {
    if (show) {
      collectionName = initialName;
      selectedCampaignIds = [...initialSelectedIds];
    }
  });

  // Drag and Drop state
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

  function toggleCampaign(id: number) {
    if (selectedCampaignIds.includes(id)) {
      selectedCampaignIds = selectedCampaignIds.filter(i => i !== id);
    } else {
      selectedCampaignIds = [...selectedCampaignIds, id];
    }
  }

  function handleDragStart(index: number) {
    draggedIndex = index;
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    dragOverIndex = index;
  }

  function handleDrop(index: number) {
    if (draggedIndex === null || draggedIndex === index) {
        draggedIndex = null;
        dragOverIndex = null;
        return;
    }

    const newIds = [...selectedCampaignIds];
    const draggedItem = newIds.splice(draggedIndex, 1)[0];
    newIds.splice(index, 0, draggedItem);
    selectedCampaignIds = newIds;

    draggedIndex = null;
    dragOverIndex = null;
  }

  function getCampaignName(id: number) {
    return availableCampaigns.find(c => c.id === id)?.campaignNameId || 'Unknown';
  }

  async function handleInternalSave() {
    await onSave(collectionName, selectedCampaignIds);
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-8">
    <div class="bg-zinc-950 border border-white/10 rounded-3xl w-[90vw] h-[90vh] flex flex-col overflow-hidden shadow-2xl">
      <!-- Modal Header -->
      <div class="p-8 border-b border-white/5 flex justify-between items-center">
        <div>
            <h2 class="text-3xl font-headline font-black text-white tracking-tight uppercase">{editingId ? 'Edit' : 'New'} Collection</h2>
            <p class="text-zinc-500 text-sm font-medium mt-1">Select and arrange campaigns for your custom set</p>
        </div>
        <button 
          onclick={onClose}
          class="p-3 rounded-2xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all group"
          aria-label="Close modal"
        >
            <IconClose class="text-2xl group-active:scale-90" />
        </button>
      </div>

      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        <!-- Selection Side -->
        <div class="p-8 space-y-8 overflow-y-auto border-r border-white/5 bg-zinc-950/50">
          <div class="space-y-2">
            <label for="collection-name" class="block text-xs font-bold uppercase tracking-widest text-primary mb-2">Collection Name</label>
            <input
              id="collection-name"
              bind:value={collectionName}
              placeholder="e.g. My Favorites"
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-headline font-bold text-white focus:outline-none focus:border-primary transition-all placeholder:text-zinc-700"
            />
          </div>

          <div class="space-y-4">
            <div class="flex justify-between items-end">
                <div class="block text-xs font-bold uppercase tracking-widest text-primary">Available Campaigns</div>
                <div class="text-xs text-zinc-500 font-medium">{availableCampaigns.length} total</div>
            </div>
            <div class="grid grid-cols-1 gap-3">
              {#each availableCampaigns as camp (camp.id)}
                <button
                  onclick={() => toggleCampaign(camp.id)}
                  class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group/item {selectedCampaignIds.includes(camp.id) ? 'bg-primary/10 border-primary' : 'bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/[0.05]'}"
                >
                  <div class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all {selectedCampaignIds.includes(camp.id) ? 'bg-primary border-primary scale-110' : 'border-zinc-700 group-hover/item:border-zinc-500'}">
                    {#if selectedCampaignIds.includes(camp.id)}
                      <span class="text-white text-xs font-black">✓</span>
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0">
                    <span class="font-bold text-base truncate block {selectedCampaignIds.includes(camp.id) ? 'text-white' : 'text-zinc-400 group-hover/item:text-zinc-200'}">{camp.campaignNameId}</span>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Order Side -->
        <div class="p-8 flex flex-col overflow-hidden bg-black/40">
          <div class="flex justify-between items-end mb-6">
            <div class="block text-xs font-bold uppercase tracking-widest text-secondary">Selected & Order</div>
            <div class="text-xs text-zinc-500 font-medium">{selectedCampaignIds.length} selected</div>
          </div>

          <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar" role="list">
            {#if selectedCampaignIds.length === 0}
              <div class="h-full flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <IconPlus class="text-2xl text-zinc-700" />
                </div>
                <p class="text-zinc-500 text-sm font-medium">No campaigns selected.<br/>Pick some from the left panel!</p>
              </div>
            {:else}
              <div class="space-y-3">
                {#each selectedCampaignIds as id, index (id)}
                  <div 
                    draggable="true"
                    role="listitem"
                    ondragstart={() => handleDragStart(index)}
                    ondragover={(e) => handleDragOver(e, index)}
                    ondrop={() => handleDrop(index)}
                    class="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/8 rounded-2xl border border-white/5 transition-all cursor-grab active:cursor-grabbing group/row {dragOverIndex === index ? 'border-primary border-dashed bg-primary/5 translate-y-1' : ''} {draggedIndex === index ? 'opacity-40 grayscale scale-95' : ''}"
                  >
                    <div class="text-zinc-600 group-hover/row:text-zinc-400 transition-colors">
                        <IconDragIndicator class="text-xl" />
                    </div>
                    <span class="text-zinc-500 font-pixel text-[10px] w-6">{index + 1}.</span>
                    <span class="flex-1 text-sm font-bold text-zinc-200 truncate">{getCampaignName(id)}</span>
                    
                    <button 
                        onclick={() => toggleCampaign(id)}
                        class="p-2 rounded-xl hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-all opacity-0 group-hover/row:opacity-100"
                        title="Remove"
                    >
                        <IconDelete class="text-lg" />
                    </button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-8 flex gap-4 justify-end border-t border-white/5">
        <button
          onclick={onClose}
          class="px-8 py-3 rounded-2xl font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
        <button
          onclick={handleInternalSave}
          class="px-12 py-3 rounded-2xl font-headline font-black text-lg bg-primary text-white hover:bg-primary-high transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!collectionName || selectedCampaignIds.length === 0}
        >
          SAVE COLLECTION
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
