<script lang="ts">
import mediumZoom from "medium-zoom";

type Props = {
	images: string[];
	initialIndex?: number;
};

let { images, initialIndex = 0 }: Props = $props();
let selectedIndex = $state(0);
$effect(() => {
	selectedIndex = initialIndex;
});
let featuredSrc = $derived(images[selectedIndex] ?? images[0] ?? "");
let featuredContainer: HTMLDivElement;

$effect(() => {
	if (!featuredContainer) return;
	void featuredSrc;
	const zoom = mediumZoom(featuredContainer.querySelector("img")!, {
		background: "rgba(0, 0, 0, 0.85)",
		margin: 24,
	});
	return () => zoom.detach();
});
</script>

<div class="grid gap-4">
	<div class="overflow-hidden rounded-lg" bind:this={featuredContainer}>
		<img
			class="h-auto max-w-full w-full rounded-lg object-cover transition-opacity duration-300"
			src={featuredSrc}
			alt="Featured"
		/>
	</div>
	<div class="grid grid-cols-5 gap-4">
		{#each images as src, i}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="cursor-pointer overflow-hidden rounded-lg ring-2 transition-all duration-200 {selectedIndex === i ? 'ring-blue-500 opacity-100' : 'ring-transparent opacity-60 hover:opacity-90'}"
				onclick={() => selectedIndex = i}
			>
				<img
					class="h-auto max-w-full w-full rounded-lg object-cover"
					src={src}
					alt="Thumbnail {i + 1}"
				/>
			</div>
		{/each}
	</div>
</div>
