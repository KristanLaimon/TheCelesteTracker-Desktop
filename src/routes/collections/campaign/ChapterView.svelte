<script lang="ts">
  import { syncStore } from "$lib/logic/sync_store.svelte";
  import ChevronRight from "~icons/material-symbols/chevron-right";
  import List from "~icons/material-symbols/list";
  import LayoutGrid from "~icons/material-symbols/grid-view";
  import Star from "~icons/material-symbols/star";
  import Award from "~icons/material-symbols/rewarded-ads";
  import { page } from '$app/state';

  let campaignId = $derived(Number(page.params.campaign_id) || 1);
  let chapters = $derived(syncStore.chapters);

  $effect(() => {
    if (campaignId) {
      syncStore.fetchChapters(campaignId);
    }
  });

  let viewMode = $state<'table' | 'grid'>('table');
</script>

<header class="mb-10">
  <nav class="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">
    <span>Map Collections</span>
    <ChevronRight class="w-3 h-3" />
    <span style="color: var(--mapscollection-primary)">Campaign View</span>
  </nav>
  
  <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
    <div class="flex-1">
      <div class="flex items-center justify-between gap-4 mb-4">
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-white tracking-tighter">
          Campaign <span class="italic" style="color: var(--mapscollection-primary)">Chapters</span>
        </h1>
      </div>

      <div class="flex flex-wrap gap-8 sm:gap-12 mt-6">
        <div class="flex flex-col">
          <span class="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Total Chapters</span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl sm:text-3xl font-headline font-bold text-white">{chapters.length}</span>
          </div>
        </div>
        <div class="flex flex-col">
          <span class="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Total Deaths</span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl sm:text-3xl font-headline font-bold text-white">
              {chapters.reduce((acc, c) => acc + c.total_deaths, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="inline-flex p-1 bg-zinc-900 rounded-lg border border-(--mapscollection-outline) self-start lg:mb-1">
      <button 
        onclick={() => viewMode = 'table'}
        class="px-4 sm:px-5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 {viewMode === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}"
      >
        <List class="w-3 h-3" /> Table
      </button>
      <button 
        onclick={() => viewMode = 'grid'}
        class="px-4 sm:px-5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 {viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}"
      >
        <LayoutGrid class="w-3 h-3" /> Grid
      </button>
    </div>
  </div>
</header>

<div class="relative">
  {#if viewMode === 'table'}
    <section class="bg-transparent sm:bg-zinc-900/50 sm:border sm:border-(--mapscollection-outline) sm:rounded-2xl overflow-hidden">
      <div class="hidden sm:grid grid-cols-12 px-6 py-4 border-b border-(--mapscollection-outline) text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em]">
        <div class="col-span-4">Level Name</div>
        <div class="col-span-2">Mode</div>
        <div class="col-span-2 text-right">Deaths</div>
        <div class="col-span-2 text-right">Runs</div>
        <div class="col-span-2 text-center">Golden</div>
      </div>
      
      <div class="flex flex-col gap-4 sm:gap-0 sm:divide-y sm:divide-(--mapscollection-outline)">
        {#each chapters as chapter}
          <a href="/collections/campaign/chapter/{encodeURIComponent(chapter.sid)}?side={chapter.side_id}"
            class="bg-zinc-900/50 sm:bg-transparent border-none rounded-xl sm:rounded-none overflow-hidden group hover:bg-white/5 transition-all"
          >
            <div class="grid grid-cols-1 sm:grid-cols-12 items-center px-5 py-5 sm:px-6 sm:py-4">
              <div class="col-span-1 sm:col-span-4 flex items-center gap-3">
                <div class="w-8 h-8 rounded flex items-center justify-center transition-transform group-hover:scale-110 bg-primary/10 text-primary">
                  <Star class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="font-bold text-zinc-200 text-sm">{chapter.name}</h3>
                  <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{chapter.sid.split('/').pop()}</p>
                </div>
              </div>
              
              <div class="col-span-1 sm:col-span-8 grid grid-cols-2 sm:grid-cols-8 gap-4 sm:gap-0 items-center">
                <div class="sm:col-span-2">
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter w-fit bg-secondary/10 text-secondary">
                    {chapter.side_id}
                  </span>
                </div>
                
                <div class="sm:col-span-2 sm:text-right">
                  <span class="font-headline text-sm font-bold text-zinc-200">
                    {chapter.total_deaths}
                  </span>
                </div>

                <div class="sm:col-span-2 sm:text-right">
                  <span class="font-headline text-sm font-bold text-zinc-400">
                    {chapter.total_runs}
                  </span>
                </div>

                <div class="sm:col-span-2 flex justify-center">
                    <div class="w-5 h-5 rounded-full border-2 border-dashed border-zinc-700"></div>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {:else}
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each chapters as chapter}
        <a href="/collections/campaign/chapter/{encodeURIComponent(chapter.sid)}?side={chapter.side_id}" 
          class="relative group overflow-hidden rounded-2xl bg-zinc-900 min-h-[200px] flex flex-col justify-end p-6 border transition-all border-(--mapscollection-outline)"
        >
          <div class="absolute inset-0 z-0">
            <div class="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent"></div>
          </div>
          
          <div class="relative z-10">
            <div class="flex justify-between items-start mb-2">
              <Star class="w-6 h-6 text-primary" />
              <span class="text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter bg-secondary/20 text-secondary">
                {chapter.side_id}
              </span>
            </div>
            
            <h3 class="text-xl font-headline font-bold text-white mb-4">{chapter.name}</h3>
            
            <div class="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-(--mapscollection-outline) pt-4">
              <div>
                <p class="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Deaths</p>
                <p class="text-base font-headline font-bold text-white">
                  {chapter.total_deaths}
                </p>
              </div>
              <div>
                <p class="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Runs</p>
                <p class="text-base font-headline font-bold text-white">{chapter.total_runs}</p>
              </div>
            </div>
          </div>
        </a>
      {/each}
    </section>
  {/if}
</div>
