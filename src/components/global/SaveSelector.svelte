<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { onMount } from "svelte";
    import { saveStore } from "../../lib/saveStore.svelte.ts";

    let slots: number[] = $state([1]);

    onMount(async () => {
        try {
            const fetchedSlots: number[] = await invoke("get_save_slots", { userId: saveStore.userId });
            if (fetchedSlots.length > 0) {
                slots = fetchedSlots;
                // Default to first available slot if current isn't valid
                if (!slots.includes(saveStore.selectedSlot)) {
                    saveStore.selectedSlot = slots[0];
                }
            }
        } catch (e) {
            console.error("Failed to fetch save slots:", e);
        }
    });

    function handleSelect(slot: number) {
        saveStore.selectedSlot = slot;
    }
</script>

<div class="flex items-center gap-3">
    <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-tighter">Save Slot</span>
    <div class="flex items-center gap-1.5 bg-zinc-950/50 border border-outline-muted p-1 rounded-xl">
        {#each slots as slot}
            <button
                type="button"
                class="px-3 py-1 text-[11px] font-bold rounded-lg transition-all border {saveStore.selectedSlot === slot ? 'bg-secondary border-secondary text-zinc-950 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-white/5'}"
                onclick={() => handleSelect(slot)}
            >
                {slot}
            </button>
        {/each}
    </div>
</div>
