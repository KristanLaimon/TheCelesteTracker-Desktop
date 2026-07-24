<script lang="ts">
import { onMount } from "svelte";
import type { WithGLState } from "../../../libs/GoldenLayoutThemes/GoldenLayout.types";
import ModViewSteering from "../ModView.steering.svelte";
import { CATEGORY_COLORS } from "./ModsSearch.categoryColors";
import ModsSearchRowsCache, { type ModsSearchRow } from "./ModsSearch.rowsCache.store.svelte";
import ModsSearchStore from "./ModsSearch.store.svelte";

type Props = { ownedModViewTabId?: string };

let { ownedModViewTabId = $bindable(undefined), onStateChange, createNewTab, focusTab }: WithGLState<Props> = $props();

let viewFilter = $state<"all" | "installed">("all");

onMount(() => {
	ModsSearchRowsCache.Load();
});

$effect(() => {
	if (ownedModViewTabId) onStateChange?.({ ownedModViewTabId });
});

const filteredRows = $derived.by(() => {
	const q = ModsSearchStore.searchQuery.trim().toLowerCase();
	const cats = ModsSearchStore.selectedCategories;
	const installedOnly = viewFilter === "installed";
	return ModsSearchRowsCache.rows.filter((r) => {
		if (installedOnly && !r.installed) return false;
		const matchesQuery = !q || r.humanName.toLowerCase().includes(q) || r.key.toLowerCase().includes(q);
		const matchesCategory = cats.includes(r.category);
		return matchesQuery && matchesCategory;
	});
});

const sortedRows = $derived.by(() => {
	const list = [...filteredRows];
	if (ModsSearchStore.sortBy === "size") list.sort((a, b) => (b.sizeBytes ?? -1) - (a.sizeBytes ?? -1));
	else list.sort((a, b) => (b.dependenciesCount ?? -1) - (a.dependenciesCount ?? -1));
	return list;
});

function formatBytes(bytes: number | null): string {
	if (bytes === null) return "—";
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex++;
	}
	return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function onRowClick(row: ModsSearchRow) {
	// row.modNameId is null for tier-2 fallback rows (mod uninstalled before this app ever
	// scanned it) — nothing real to look up, ModView's search still works off row.humanName
	const lookupId = row.modNameId ?? row.humanName;

	if (ownedModViewTabId && focusTab?.(ownedModViewTabId)) {
		ModViewSteering.SetSteeredMod(ownedModViewTabId, lookupId);
		return;
	}

	const newTabId = createNewTab?.("modView", row.humanName, { searchQuery: lookupId });
	if (newTabId) {
		ownedModViewTabId = newTabId;
		ModViewSteering.SetSteeredMod(newTabId, lookupId);
	}
}
</script>

<div
  class="h-full w-full overflow-hidden bg-[#121216]"
  style="container-type: size; container-name: modssearch-results;"
>
  <div class="results-content flex h-full flex-col overflow-hidden">
    <div class="flex shrink-0 items-center gap-3 border-b border-[#2A2A35] px-3 py-2">
      <h2 class="text-sm font-semibold text-white">
        Results <span class="text-[#8B8B99]">{sortedRows.length}</span>
      </h2>
      <div class="ml-auto flex gap-1.5">
        <button
          type="button"
          onclick={() => (viewFilter = "all")}
          class={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
            viewFilter === "all" ? "border-[#E84A5F] bg-[#E84A5F]/15 text-white" : "border-[#2A2A35] bg-[#1A1A20] text-[#8B8B99] hover:text-white"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onclick={() => (viewFilter = "installed")}
          class={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
            viewFilter === "installed" ? "border-[#E84A5F] bg-[#E84A5F]/15 text-white" : "border-[#2A2A35] bg-[#1A1A20] text-[#8B8B99] hover:text-white"
          }`}
        >
          Installed Only
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-auto">
      {#if ModsSearchRowsCache.loading && sortedRows.length === 0}
        <p class="p-4 text-sm text-[#8B8B99]">Loading mods...</p>
      {:else if sortedRows.length === 0}
        <p class="p-4 text-sm text-[#8B8B99]">No mods match the current search/filters.</p>
      {:else}
        <table class="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead class="sticky top-0 bg-[#121216]">
            <tr class="border-b border-[#2A2A35] text-xs text-[#8B8B99]">
              <th class="px-3 py-2 font-medium">Name</th>
              <th class="px-3 py-2 font-medium">Category</th>
              <th class="px-3 py-2 font-medium">Size</th>
              <th class="px-3 py-2 font-medium">Dependencies</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedRows as row (row.key)}
              <tr
                class="cursor-pointer border-b border-[#2A2A35]/50 hover:bg-[#1A1A20]"
                onclick={() => onRowClick(row)}
              >
                <td class="px-3 py-2 text-white">
                  <span class="inline-flex items-center gap-2">
                    {row.humanName}
                    {#if row.installed}
                      <span class="rounded-full border border-[#4CAF50]/40 bg-[#4CAF50]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#4CAF50]">
                        Installed
                      </span>
                    {/if}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <span style:color={CATEGORY_COLORS[row.category]}>{row.category}</span>
                </td>
                <td class="px-3 py-2 text-[#8B8B99]">{formatBytes(row.sizeBytes)}</td>
                <td class="px-3 py-2 text-[#8B8B99]">{row.dependenciesCount ?? "—"}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>
