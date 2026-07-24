<script lang="ts">
import { onMount } from "svelte";
import type { WithGLState } from "../../../libs/GoldenLayoutThemes/GoldenLayout.types";
import { CATEGORY_COLORS } from "./ModsSearch.categoryColors";
import ModsSearchRowsCache from "./ModsSearch.rowsCache.store.svelte";
import ModsSearchStore, { type ModsSearchCategory, ModsSearchCategoryList } from "./ModsSearch.store.svelte";

type Props = { searchQuery?: string; categories?: ModsSearchCategory[] };

let { searchQuery: initialSearchQuery, categories: initialCategories, onStateChange }: WithGLState<Props> = $props();

onMount(() => {
	if (initialSearchQuery) ModsSearchStore.searchQuery = initialSearchQuery;
	if (initialCategories?.length) ModsSearchStore.selectedCategories = initialCategories;
	ModsSearchRowsCache.Load();
	return () => ModsSearchStore.Reset();
});

$effect(() => {
	onStateChange?.({ searchQuery: ModsSearchStore.searchQuery, categories: ModsSearchStore.selectedCategories });
});

const countsByCategory = $derived.by(() => {
	const q = ModsSearchStore.searchQuery.trim().toLowerCase();
	const matching = ModsSearchRowsCache.rows.filter((r) => !q || r.humanName.toLowerCase().includes(q) || r.key.toLowerCase().includes(q));
	const counts: Partial<Record<ModsSearchCategory, number>> = {};
	for (const row of matching) counts[row.category] = (counts[row.category] ?? 0) + 1;
	return counts;
});
const totalCount = $derived(Object.values(countsByCategory).reduce((a, b) => a + b, 0));
const isAllSelected = $derived(ModsSearchStore.selectedCategories.length === ModsSearchCategoryList.length);

const totalIndexed = $derived(ModsSearchRowsCache.rows.length);
const totalInstalled = $derived(ModsSearchRowsCache.rows.filter((r) => r.installed).length);

function toggleCategory(cat: ModsSearchCategory) {
	const cur = ModsSearchStore.selectedCategories;
	ModsSearchStore.selectedCategories = cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat];
}

function selectAll() {
	ModsSearchStore.selectedCategories = [...ModsSearchCategoryList];
}
</script>

<div
  class="h-full w-full overflow-hidden bg-[#121216]"
  style="container-type: size; container-name: modssearch-sidebar;"
>
  <div class="sidebar-content flex h-full flex-col gap-4 overflow-y-auto p-3">
    <div class="relative shrink-0">
      <input
        type="text"
        bind:value={ModsSearchStore.searchQuery}
        placeholder="Search mods..."
        class="w-full rounded-lg border border-[#2A2A35] bg-[#1A1A20] px-3 py-2 text-sm text-white placeholder-[#8B8B99] focus:border-[#E84A5F] focus:outline-none"
      />
      {#if ModsSearchStore.searchQuery}
        <button
          type="button"
          onclick={() => (ModsSearchStore.searchQuery = "")}
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8B8B99] hover:text-white cursor-pointer"
          aria-label="Clear search"
        >
          ×
        </button>
      {/if}
    </div>

    <div class="flex shrink-0 flex-wrap gap-1.5">
      <button
        type="button"
        onclick={selectAll}
        class={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
          isAllSelected ? "border-[#E84A5F] bg-[#E84A5F]/15 text-white" : "border-[#2A2A35] bg-[#1A1A20] text-[#8B8B99] hover:text-white"
        }`}
      >
        All <span class="opacity-70">{totalCount}</span>
      </button>
      {#each ModsSearchCategoryList as cat (cat)}
        {@const active = ModsSearchStore.selectedCategories.includes(cat)}
        <button
          type="button"
          onclick={() => toggleCategory(cat)}
          class="cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
          style:border-color={active ? CATEGORY_COLORS[cat] : "#2A2A35"}
          style:background={active ? `${CATEGORY_COLORS[cat]}26` : "#1A1A20"}
          style:color={active ? CATEGORY_COLORS[cat] : "#8B8B99"}
        >
          {cat} <span class="opacity-70">{countsByCategory[cat] ?? 0}</span>
        </button>
      {/each}
    </div>

    <div class="shrink-0">
      <label class="mb-1 block text-xs text-[#8B8B99]" for="modssearch-sort">Sort by</label>
      <select
        id="modssearch-sort"
        bind:value={ModsSearchStore.sortBy}
        class="w-full rounded-lg border border-[#2A2A35] bg-[#1A1A20] px-2 py-1.5 text-sm text-white focus:border-[#E84A5F] focus:outline-none"
      >
        <option value="size">Size (zip size)</option>
        <option value="dependencies">No. of dependencies</option>
      </select>
    </div>

    <div class="mt-auto shrink-0 space-y-1 border-t border-[#2A2A35] pt-3 text-xs text-[#8B8B99]">
      <p>{totalIndexed} mods indexed</p>
      <p>{totalInstalled} mods installed</p>
    </div>
  </div>
</div>

<style>
  @container modssearch-sidebar (min-aspect-ratio: 1/1) {
    .sidebar-content {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: flex-start;
      overflow-y: hidden;
      overflow-x: auto;
    }
    .sidebar-content > * {
      flex-shrink: 0;
    }
  }
</style>
