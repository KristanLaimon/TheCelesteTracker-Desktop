<script lang="ts">
  import { syncStore } from "$lib/logic/sync_store.svelte";
  import Trophy from "~icons/material-symbols/trophy";
  import ChevronRight from "~icons/material-symbols/chevron-right";
  import Folder from "~icons/material-symbols/folder";
  import type { Campaign } from "../types/entities";

  function selectCampaign(id: number) {
    syncStore.fetchChapters(id);
  }
</script>

{#snippet campaignItem(campaign: Campaign)}
  {@const isActive = syncStore.activeCampaignId === campaign.id}
  
  <li>
    <button
      onclick={() => selectCampaign(campaign.id)}
      class="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-all group relative mb-1
             {isActive ? 'bg-accent shadow-sm ring-1 ring-border' : 'bg-muted/30'}"
    >
      <div class="flex justify-between items-start">
        <div class="flex items-start gap-3">
          <div class="mt-0.5">
            <Folder class="w-4 h-4 {isActive ? 'text-primary' : 'text-muted-foreground/40'}" />
          </div>
          <div class="space-y-1">
            <span class="font-semibold block leading-none text-sm">{campaign.campaign_name_id}</span>
            <span class="text-[9px] uppercase tracking-wider text-muted-foreground font-black">
              {campaign.total_runs} Runs • {campaign.total_deaths} Deaths
            </span>
          </div>
        </div>
        <ChevronRight class="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </div>
      
      {#if isActive}
        <div class="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full"></div>
      {/if}
    </button>
  </li>
{/snippet}

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
        {@render campaignItem(campaign)}
      {/each}
    </ul>
  {/if}
</div>
