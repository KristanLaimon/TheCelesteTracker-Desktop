<script lang="ts">
import { onMount } from "svelte";

export type IndexableComponentOption = {
	goldenLayoutKey: string;
	thumbnail: string;
	title?: string;
	description?: string;
	tags?: string[];
};

type Props = {
	indexableComponents?: IndexableComponentOption[];
	onSelectPage?: (goldenLayoutKey: string, title: string) => void;
	onCancel?: () => void;
};

let { indexableComponents = [], onSelectPage, onCancel }: Props = $props();

let searchQuery = $state("");

const filteredComponents = $derived.by(() => {
	const query = searchQuery.trim().toLowerCase();
	if (!query) return indexableComponents;

	return indexableComponents.filter((item) => {
		const titleMatch = (item.title || item.goldenLayoutKey).toLowerCase().includes(query);
		const descMatch = (item.description || "").toLowerCase().includes(query);
		const keyMatch = item.goldenLayoutKey.toLowerCase().includes(query);
		const tagsMatch = item.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false;

		return titleMatch || descMatch || keyMatch || tagsMatch;
	});
});

function handleSelect(item: IndexableComponentOption) {
	const displayTitle = item.title || item.goldenLayoutKey;
	if (onSelectPage) {
		onSelectPage(item.goldenLayoutKey, displayTitle);
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape" && onCancel) {
		onCancel();
	}
}

onMount(() => {
	window.addEventListener("keydown", handleKeydown);
	return () => {
		window.removeEventListener("keydown", handleKeydown);
	};
});
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-[#121216]/80 backdrop-blur-md p-4 sm:p-6 select-none"
	role="dialog"
	aria-modal="true"
	aria-label="Select a page"
>
	<div class="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#1A1A20] border border-[#2A2A35] rounded-2xl p-6 sm:p-8 overflow-hidden shadow-2xl">
		<!-- Header Bar -->
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0 border-b border-[#2A2A35] pb-5">
			<div>
				<h2 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
					Select a Page
				</h2>
				<p class="text-xs text-[#8B8B99] mt-1">
					Choose a component layout or view to mount into this GoldenLayout tab.
				</p>
			</div>

			<!-- Actions / Controls -->
			<div class="flex items-center gap-3 w-full md:w-auto">
				<!-- Dynamic Search Input -->
				<div class="relative flex-1 md:w-72">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8B8B99]">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search available pages..."
						class="w-full bg-[#121216] text-white placeholder-[#8B8B99] text-sm pl-9 pr-9 py-2 rounded-xl border border-[#2A2A35] focus:outline-none focus:border-[#E84A5F] transition-all"
					/>
					{#if searchQuery}
						<button
							type="button"
							onclick={() => (searchQuery = "")}
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B8B99] hover:text-white transition-colors cursor-pointer"
							aria-label="Clear search"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>

				<!-- Close / Cancel Button -->
				<button
					type="button"
					onclick={onCancel}
					class="bg-[#121216] hover:bg-[#2A2A35] text-[#8B8B99] hover:text-white p-2 rounded-xl border border-[#2A2A35] transition-all cursor-pointer flex items-center justify-center"
					aria-label="Close page selector"
					title="Close page selector (Esc)"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Page Selector Grid Container -->
		<div class="flex-1 overflow-y-auto pr-1">
			{#if filteredComponents.length > 0}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-4">
					{#each filteredComponents as item (item.goldenLayoutKey)}
						<div
							class="bg-[#121216] border border-[#2A2A35] hover:border-[#E84A5F] rounded-xl overflow-hidden transition-colors duration-200 flex flex-col group cursor-pointer"
							onclick={() => handleSelect(item)}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleSelect(item);
								}
							}}
							role="button"
							tabindex="0"
						>
							<!-- Thumbnail Image Preview -->
							<div class="relative aspect-video w-full overflow-hidden bg-[#0D0D11] border-b border-[#2A2A35]">
								<img
									src={item.thumbnail}
									alt={item.title || item.goldenLayoutKey}
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
							</div>

							<!-- Card Body Details -->
							<div class="p-4 flex-1 flex flex-col">
								<div class="flex items-center justify-between gap-2">
									<h3 class="text-base font-semibold text-white group-hover:text-[#FF5E7E] transition-colors">
										{item.title || item.goldenLayoutKey}
									</h3>
									<span class="text-[10px] font-mono uppercase bg-[#2A2A35] text-[#8B8B99] px-2 py-0.5 rounded">
										{item.goldenLayoutKey}
									</span>
								</div>

								{#if item.description}
									<p class="text-xs text-[#8B8B99] mt-2 line-clamp-2 leading-relaxed">
										{item.description}
									</p>
								{/if}

								{#if item.tags && item.tags.length > 0}
									<div class="flex flex-wrap gap-1 mt-3">
										{#each item.tags as tag}
											<span class="text-[10px] bg-[#2A2A35]/60 text-[#8B8B99] px-2 py-0.5 rounded-full border border-[#2A2A35]">
												#{tag}
											</span>
										{/each}
									</div>
								{/if}

								<!-- Select Action Button -->
								<div class="mt-4 pt-3 border-t border-[#2A2A35]/50 flex items-center justify-between">
									<span class="text-xs text-[#8B8B99] group-hover:text-white transition-colors">
										Click to mount
									</span>
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											handleSelect(item);
										}}
										class="bg-[#E84A5F] hover:bg-[#FF5E7E] text-white font-medium text-xs py-1.5 px-4 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
									>
										<span>Select</span>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
										</svg>
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Empty State Search Filter -->
				<div class="flex flex-col items-center justify-center h-48 text-center p-6 bg-[#121216] rounded-xl border border-[#2A2A35] my-4">
					<div class="w-10 h-10 rounded-full bg-[#2A2A35]/60 flex items-center justify-center text-[#8B8B99] mb-3">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</div>
					<h4 class="text-sm font-semibold text-white">No pages found</h4>
					<p class="text-xs text-[#8B8B99] mt-1 max-w-sm">
						No available component pages match your search query "<span class="text-white">{searchQuery}</span>".
					</p>
					<button
						type="button"
						onclick={() => (searchQuery = "")}
						class="mt-3 bg-[#2A2A35] hover:bg-[#3F3F46] text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
					>
						Clear Search Query
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
