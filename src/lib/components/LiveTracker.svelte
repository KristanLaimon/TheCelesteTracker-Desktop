<script lang="ts">
  import { syncStore } from "$lib/logic/sync_store.svelte";
  import Monitoring from "~icons/material-symbols/monitoring";
  import Bolt from "~icons/material-symbols/bolt";
  import Map from "~icons/material-symbols/map";
  import Pulse from "~icons/material-symbols/show-chart";
</script>

{#if syncStore.currentRun}
  <div class="fixed bottom-6 right-6 p-6 bg-card/95 backdrop-blur-xl rounded-2xl border border-primary/30 shadow-2xl min-w-[280px] animate-in slide-in-from-right-10 fade-in duration-500 z-50">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <div class="relative">
          <div class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
          <div class="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary animate-ping opacity-40"></div>
        </div>
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/90">Active Session</h3>
      </div>
      <Pulse class="w-3.5 h-3.5 text-muted-foreground/40" />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1 group">
        <div class="flex items-center gap-1.5 text-muted-foreground">
          <Monitoring class="w-3.5 h-3.5" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Deaths</span>
        </div>
        <div class="text-3xl font-black tabular-nums group-hover:text-primary transition-colors leading-none">
          {syncStore.currentRun.deaths}
        </div>
      </div>

      <div class="space-y-1 group">
        <div class="flex items-center gap-1.5 text-muted-foreground">
          <Bolt class="w-3.5 h-3.5" />
          <span class="text-[10px] font-bold uppercase tracking-wider">Dashes</span>
        </div>
        <div class="text-3xl font-black tabular-nums group-hover:text-primary transition-colors leading-none">
          {syncStore.currentRun.time_ticks}
        </div>
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-border/50">
      <div class="flex items-center gap-2 text-muted-foreground/60">
        <Map class="w-3 h-3" />
        <span class="text-[9px] font-medium truncate uppercase tracking-tight">
          Monitoring {syncStore.isWsConnected ? 'WebSocket Stream' : 'Connection Lost'}
        </span>
      </div>
    </div>
  </div>
{/if}
