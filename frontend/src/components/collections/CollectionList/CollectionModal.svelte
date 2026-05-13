<script lang="ts">
  import IconPlus from '~icons/material-symbols/add';
  import IconDelete from '~icons/material-symbols/delete';
  import IconClose from '~icons/material-symbols/close';
  import IconCheck from '~icons/material-symbols/check';
  import IconDragIndicator from '~icons/material-symbols/drag-indicator';
  import IconFolder from '~icons/material-symbols/folder';
  import IconMap from '~icons/material-symbols/map';
  import IconSave from '~icons/material-symbols/save';
  import IconSearch from '~icons/material-symbols/search';
  import IconViewList from '~icons/material-symbols/view-list';

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
    onClose,
  }: Props = $props();

  let collectionName = $state(initialName);
  let selectedCampaignIds = $state<number[]>([...initialSelectedIds]);
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);
  let draggedCampaignId = $state<number | null>(null);
  let dragSource = $state<'available' | 'selected' | null>(null);
  let isDraggingOverSelected = $state(false);
  let isDraggingOverAvailable = $state(false);
  let availableToSelect = $derived(availableCampaigns.filter((campaign) => !selectedCampaignIds.includes(campaign.id)));

  $effect(() => {
    if (show) {
      collectionName = initialName;
      selectedCampaignIds = [...initialSelectedIds];
    }
  });

  function toggleCampaign(id: number) {
    if (selectedCampaignIds.includes(id)) {
      selectedCampaignIds = selectedCampaignIds.filter((item) => item !== id);
    } else {
      selectedCampaignIds = [...selectedCampaignIds, id];
    }
  }

  function handleAvailableDragStart(id: number, e: DragEvent) {
    draggedCampaignId = id;
    draggedIndex = null;
    dragSource = 'available';
    e.dataTransfer?.setData('text/plain', String(id));
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copyMove';
  }

  function handleSelectedDragStart(index: number, id: number, e: DragEvent) {
    draggedIndex = index;
    draggedCampaignId = id;
    dragSource = 'selected';
    e.dataTransfer?.setData('text/plain', String(id));
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  function resetDragState() {
    draggedIndex = null;
    dragOverIndex = null;
    draggedCampaignId = null;
    dragSource = null;
    isDraggingOverSelected = false;
    isDraggingOverAvailable = false;
  }

  function handleSelectedDragOver(e: DragEvent, index: number | null = null) {
    e.preventDefault();
    isDraggingOverSelected = true;
    isDraggingOverAvailable = false;
    dragOverIndex = index;
  }

  function handleAvailableDragOver(e: DragEvent) {
    if (dragSource !== 'selected') return;
    e.preventDefault();
    isDraggingOverAvailable = true;
    isDraggingOverSelected = false;
  }

  function handleSelectedDrop(index: number | null = null) {
    if (draggedCampaignId === null) {
      resetDragState();
      return;
    }

    const newIds = [...selectedCampaignIds];

    if (dragSource === 'selected' && draggedIndex !== null) {
      if (draggedIndex === index) {
        resetDragState();
        return;
      }

      const draggedItem = newIds.splice(draggedIndex, 1)[0];
      const targetIndex = index === null ? newIds.length : Math.min(index, newIds.length);
      newIds.splice(targetIndex, 0, draggedItem);
    } else if (dragSource === 'available' && !newIds.includes(draggedCampaignId)) {
      const targetIndex = index === null ? newIds.length : Math.min(index, newIds.length);
      newIds.splice(targetIndex, 0, draggedCampaignId);
    }

    selectedCampaignIds = newIds;
    resetDragState();
  }

  function handleAvailableDrop() {
    if (dragSource === 'selected' && draggedCampaignId !== null) {
      selectedCampaignIds = selectedCampaignIds.filter((id) => id !== draggedCampaignId);
    }
    resetDragState();
  }

  function getCampaignName(id: number) {
    return availableCampaigns.find((campaign) => campaign.id === id)?.campaignNameId || 'Unknown';
  }

  function formatCampaignName(name: string) {
    const parts = name.split('/').filter(Boolean);
    return parts.at(-1) || name;
  }

  async function handleInternalSave() {
    await onSave(collectionName, selectedCampaignIds);
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8">
    <div class="bg-zinc-950 border border-outline-muted rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
      <div class="p-5 md:p-6 border-b border-outline-muted flex justify-between items-center bg-card-bg/60">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-12 h-12 rounded-xl bg-orange-400/15 border border-orange-400/25 text-orange-300 flex items-center justify-center shrink-0">
            <IconFolder class="text-2xl" />
          </div>
          <div class="min-w-0">
            <h2 class="text-2xl md:text-3xl font-headline font-black text-white tracking-tight uppercase truncate">
              {editingId ? 'Edit Collection' : 'New Collection'}
            </h2>
            <p class="text-zinc-500 text-sm font-medium mt-1">Select campaigns and set their display order.</p>
          </div>
        </div>
        <button
          onclick={onClose}
          class="p-3 rounded-xl bg-zinc-900 border border-outline-muted hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all group"
          aria-label="Close modal"
        >
          <IconClose class="text-2xl group-active:scale-90" />
        </button>
      </div>

      <div class="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] overflow-hidden">
        <div
          class="p-5 md:p-6 space-y-5 overflow-y-auto border-r border-outline-muted bg-zinc-950/50 custom-scrollbar {isDraggingOverAvailable ? 'bg-primary/5' : ''}"
          ondragover={handleAvailableDragOver}
          ondragleave={() => isDraggingOverAvailable = false}
          ondrop={handleAvailableDrop}
        >
          <div class="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 flex items-start gap-3">
            <IconDragIndicator class="text-xl text-primary shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed text-zinc-300">
              Drag campaign cards into the selected list, drag selected cards to reorder them, or drag them back here to remove them.
            </p>
          </div>

          <div class="space-y-2">
            <label for="collection-name" class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-2">
              <IconMap class="text-lg" />
              Collection Name
            </label>
            <div class="relative">
              <IconFolder class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xl" />
              <input
                id="collection-name"
                bind:value={collectionName}
                placeholder="e.g. My Favorites"
                class="w-full bg-zinc-900/80 border border-outline-muted rounded-xl pl-12 pr-4 py-4 text-xl font-headline font-bold text-white focus:outline-none focus:border-primary transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between items-end">
              <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                <IconSearch class="text-lg" />
                Available Campaigns
              </div>
              <div class="text-xs text-zinc-500 font-medium">{availableToSelect.length} available</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl transition-colors {isDraggingOverAvailable ? 'outline outline-1 outline-primary/40 outline-offset-4' : ''}">
              {#each availableToSelect as camp (camp.id)}
                <button
                  onclick={() => toggleCampaign(camp.id)}
                  draggable="true"
                  ondragstart={(e) => handleAvailableDragStart(camp.id, e)}
                  ondragend={resetDragState}
                  class="drag-card w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group/item bg-zinc-900/60 border-outline-muted hover:border-white/20 hover:bg-white/[0.05] {dragSource === 'available' && draggedCampaignId === camp.id ? 'picked-up' : ''}"
                >
                  <div class="w-7 h-7 rounded-lg border flex items-center justify-center transition-all shrink-0 border-zinc-700 group-hover/item:border-zinc-500">
                    <IconPlus class="text-zinc-600 text-lg" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <span class="font-bold text-sm truncate block text-zinc-400 group-hover/item:text-zinc-200">
                      {formatCampaignName(camp.campaignNameId)}
                    </span>
                    <span class="text-[10px] text-zinc-600 truncate block mt-0.5">{camp.campaignNameId}</span>
                  </div>
                </button>
              {/each}
              {#if availableToSelect.length === 0}
                <div class="md:col-span-2 rounded-xl border border-dashed border-outline-muted p-6 text-center text-sm text-zinc-600">
                  All campaigns are selected.
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div
          class="p-5 md:p-6 flex flex-col overflow-hidden bg-black/40 {isDraggingOverSelected ? 'bg-secondary/5' : ''}"
          ondragover={(e) => handleSelectedDragOver(e)}
          ondragleave={() => isDraggingOverSelected = false}
          ondrop={() => handleSelectedDrop()}
        >
          <div class="flex justify-between items-end mb-6">
            <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary">
              <IconViewList class="text-lg" />
              Selected Order
            </div>
            <div class="text-xs text-zinc-500 font-medium">{selectedCampaignIds.length} selected</div>
          </div>

          <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar" role="list">
            {#if selectedCampaignIds.length === 0}
              <div class="h-full flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed {isDraggingOverSelected ? 'border-secondary bg-secondary/10' : 'border-transparent'}">
                <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <IconPlus class="text-2xl text-zinc-700" />
                </div>
                <p class="text-zinc-500 text-sm font-medium">Drag campaigns here.</p>
              </div>
            {:else}
              <div class="space-y-3">
                {#each selectedCampaignIds as id, index (id)}
                  <div
                    draggable="true"
                    role="listitem"
                    ondragstart={(e) => handleSelectedDragStart(index, id, e)}
                    ondragover={(e) => handleSelectedDragOver(e, index)}
                    ondragend={resetDragState}
                    ondrop={(e) => { e.stopPropagation(); handleSelectedDrop(index); }}
                    class="drag-card flex items-center gap-4 p-4 bg-zinc-900/70 hover:bg-white/[0.06] rounded-xl border border-outline-muted transition-all cursor-grab active:cursor-grabbing group/row {dragOverIndex === index ? 'border-primary border-dashed bg-primary/5 translate-y-1' : ''} {draggedIndex === index ? 'picked-up' : ''}"
                  >
                    <div class="text-zinc-600 group-hover/row:text-zinc-400 transition-colors">
                      <IconDragIndicator class="text-xl" />
                    </div>
                    <span class="text-zinc-500 font-pixel text-[10px] w-6">{index + 1}.</span>
                    <span class="flex-1 text-sm font-bold text-zinc-200 truncate">{formatCampaignName(getCampaignName(id))}</span>

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

      <div class="p-5 md:p-6 flex gap-3 justify-end border-t border-outline-muted bg-card-bg/40">
        <button
          onclick={onClose}
          class="px-6 py-3 rounded-xl font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
        <button
          onclick={handleInternalSave}
          class="px-8 py-3 rounded-xl font-headline font-black text-base bg-primary text-white hover:bg-primary-high transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={!collectionName || selectedCampaignIds.length === 0}
        >
          <IconSave class="text-xl" />
          Save Collection
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    display: none;
    width: 0;
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

  .custom-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .drag-card {
    transform-origin: center;
    will-change: transform, opacity, filter;
    transition:
      transform 180ms ease,
      opacity 180ms ease,
      filter 180ms ease,
      box-shadow 180ms ease,
      border-color 180ms ease,
      background-color 180ms ease;
  }

  .picked-up {
    opacity: 0.58;
    transform: rotate(1.25deg) scale(1.035);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08);
    filter: saturate(1.15);
  }
</style>
