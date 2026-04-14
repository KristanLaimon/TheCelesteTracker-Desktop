<script lang="ts">
  import { syncStore } from "$lib/logic/sync_store.svelte";
  import type { Run } from "../types/entities";
  import { Ghost, Zap, Save, Trash2, X } from "lucide-svelte";
  import RoomHeatmap from "./RoomHeatmap.svelte";

  let { run, onclose }: { run: Run; onclose: () => void } = $props();

  let deaths = $state(run.deaths);
  let strawberries = $state(run.strawberries);
  let isSaving = $state(false);
  let isDeleting = $state(false);

  async function handleSave() {
    isSaving = true;
    try {
      await syncStore.updateRun(run.id, deaths, strawberries);
      onclose();
    } catch (e) {
      alert(e);
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this run? This action cannot be undone.",
      )
    )
      return;
    isDeleting = true;
    try {
      await syncStore.deleteRun(run.id);
      onclose();
    } catch (e) {
      alert(e);
    } finally {
      isDeleting = false;
    }
  }
</script>

<div
  class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
>
  <div
    class="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
  >
    <div
      class="p-6 border-b border-border flex justify-between items-center bg-muted/30"
    >
      <div>
        <h2 class="text-xl font-black tracking-tight">Run Details</h2>
        <p
          class="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1"
        >
          ID: #{run.id}
        </p>
      </div>
      <button
        onclick={onclose}
        class="p-2 hover:bg-accent rounded-full transition-colors"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <div class="p-8 space-y-8 overflow-y-auto flex-1">
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-3">
          <label
            for="deaths"
            class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1"
            >Total Deaths</label
          >
          <div class="relative group">
            <Ghost
              class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors"
            />
            <input
              id="deaths"
              type="number"
              bind:value={deaths}
              class="w-full bg-muted/50 border-2 border-transparent focus:border-primary/50 focus:bg-background rounded-xl py-4 pl-12 pr-4 text-2xl font-black tabular-nums transition-all outline-none"
            />
          </div>
        </div>

        <div class="space-y-3">
          <label
            for="strawberries"
            class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1"
            >Strawberries</label
          >
          <div class="relative group">
            <Zap
              class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors"
            />
            <input
              id="strawberries"
              type="number"
              bind:value={strawberries}
              class="w-full bg-muted/50 border-2 border-transparent focus:border-primary/50 focus:bg-background rounded-xl py-4 pl-12 pr-4 text-2xl font-black tabular-nums transition-all outline-none"
            />
          </div>
        </div>
      </div>

      <div class="pt-4">
        <RoomHeatmap runId={run.id} />
      </div>
    </div>

    <div class="p-6 bg-muted/30 border-t border-border flex gap-3">
      <button
        onclick={handleDelete}
        disabled={isSaving || isDeleting}
        class="flex-1 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Trash2 class="w-5 h-5" />
        Delete
      </button>
      <button
        onclick={handleSave}
        disabled={isSaving || isDeleting}
        class="flex-[2] bg-primary text-primary-foreground hover:brightness-110 py-4 rounded-xl font-black shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save class="w-5 h-5" />
        Save Changes
      </button>
    </div>
  </div>
</div>
