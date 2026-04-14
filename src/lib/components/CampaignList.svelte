<script lang="ts">
  import { syncStore } from "$lib/logic/sync_store.svelte";
  import { Trophy, ChevronRight } from "lucide-svelte";

  function selectCampaign(id: number) {
    syncStore.fetchChapters(id);
  }
</script>

<div class="p-4 bg-card rounded-xl border border-border shadow-sm h-full overflow-y-auto">
  <div class="flex items-center gap-2 mb-6">
    <Trophy class="w-5 h-5 text-primary" />
    <h2 class="text-lg font-bold tracking-tight">Campaigns</h2>
  </div>

  {#if syncStore.campaigns.length === 0}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <p class="text-sm text-muted-foreground italic mb-2">No campaigns found.</p>
      <p class="text-xs text-muted-foreground/60">Connect Celeste and enter a save slot to sync data.</p>
    </div>
  {:else}
    <ul class="space-y-2">
      {#each syncStore.campaigns as campaign (campaign.id)}
        <li>
          <button
            onclick={() => selectCampaign(campaign.id)}
            class="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-all group relative
                   {syncStore.activeCampaignId === campaign.id ? 'bg-accent shadow-sm ring-1 ring-border' : 'bg-muted/30'}"
          >
            <div class="flex justify-between items-start">
              <div class="space-y-1">
                <span class="font-semibold block leading-none">{campaign.name}</span>
                <span class="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  {campaign.total_runs} Runs • {campaign.total_deaths} Deaths
                </span>
              </div>
              <ChevronRight class="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
            
            {#if syncStore.activeCampaignId === campaign.id}
              <div class="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full"></div>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
