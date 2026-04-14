<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import type { RoomDeath } from "../types/entities";
  import Monitoring from "~icons/material-symbols/monitoring";

  let { runId }: { runId: number } = $props();
  let roomDeaths = $state<RoomDeath[]>([]);
  let isLoading = $state(true);

  onMount(async () => {
    try {
      roomDeaths = await invoke<RoomDeath[]>("get_room_deaths", { runId });
    } catch (e) {
      console.error(e);
    } finally {
      isLoading = false;
    }
  });

  let maxDeaths = $derived(Math.max(...roomDeaths.map((d) => d.deaths), 1));

  function getHeatColor(deaths: number) {
    const ratio = deaths / maxDeaths;
    if (ratio > 0.8) return "bg-red-500 text-white";
    if (ratio > 0.5) return "bg-orange-500 text-white";
    if (ratio > 0.2) return "bg-yellow-500 text-black";
    return "bg-muted text-muted-foreground";
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-black uppercase tracking-widest text-muted-foreground">Room Death Heatmap</h3>
    <div class="flex gap-2">
      <div class="w-3 h-3 bg-muted rounded-sm"></div>
      <div class="w-3 h-3 bg-yellow-500 rounded-sm"></div>
      <div class="w-3 h-3 bg-orange-500 rounded-sm"></div>
      <div class="w-3 h-3 bg-red-500 rounded-sm"></div>
    </div>
  </div>

  {#if isLoading}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 animate-pulse">
      {#each Array(8) as _}
        <div class="h-12 bg-muted rounded-lg"></div>
      {/each}
    </div>
  {:else if roomDeaths.length === 0}
    <div class="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl opacity-50">
      <Monitoring class="w-8 h-8 mb-2" />
      <p class="text-xs font-bold uppercase tracking-widest">No room data recorded</p>
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {#each roomDeaths as room}
        <div class="group relative overflow-hidden rounded-lg border border-border/50 {getHeatColor(room.deaths)} transition-all hover:scale-[1.02]">
          <div class="p-3">
            <div class="text-[9px] font-black uppercase tracking-tighter opacity-70 truncate">{room.room_name}</div>
            <div class="text-xl font-black tabular-nums">{room.deaths}</div>
          </div>
          <div class="absolute bottom-0 left-0 h-1 bg-white/20 transition-all group-hover:h-full group-hover:bg-white/5" style="width: {(room.deaths / maxDeaths) * 100}%"></div>
        </div>
      {/each}
    </div>
  {/if}
</div>
