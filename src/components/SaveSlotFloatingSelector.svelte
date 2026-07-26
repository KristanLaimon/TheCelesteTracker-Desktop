<script lang="ts">
import saveSlotStore from "../stores/SaveSlot.store.svelte";
import BaseFloating from "./BaseFloating.svelte";
</script>

{#if saveSlotStore.availableSaveSlots.length > 0}
  <BaseFloating zIndex={200} title="Celeste Save Slot" initialX={28} initialY={24}>
    <div class="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1.5">
      {#each saveSlotStore.availableSaveSlots as slot}
        <button
          type="button"
          onclick={() => saveSlotStore.SetSelectedSaveSlot(slot.slotNumber)}
          class={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
            saveSlotStore.selectedSaveSlot === slot.slotNumber
              ? "bg-emerald-500 text-zinc-950 shadow-md font-bold"
              : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          {slot.slotName ? `${slot.slotNumber}: ${slot.slotName}` : `Slot ${slot.slotNumber}`}
        </button>
      {/each}
    </div>
  </BaseFloating>
{/if}
