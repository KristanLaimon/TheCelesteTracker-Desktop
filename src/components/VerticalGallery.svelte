<script lang="ts">
import mediumZoom from "medium-zoom";

type Props = {
	images: string[];
	imageWidth?: string;
	imageHeight?: string;
	maxRows?: number;
	alignment?: "center" | "stylish";
};

let { images, imageWidth = "100%", imageHeight = "12rem", maxRows = 1, alignment = "center" }: Props = $props();
let scrollContainer: HTMLDivElement;
let isDragging = $state(false);
let wasDragged = false;
let dragStartY = 0;
let scrollStartTop = 0;
let canScrollUp = $state(false);
let canScrollDown = $state(false);
let isWrapping = $derived(maxRows > 1);

function updateArrows() {
	if (!scrollContainer || isWrapping) return;
	canScrollUp = scrollContainer.scrollTop > 0;
	canScrollDown = scrollContainer.scrollTop + scrollContainer.clientHeight < scrollContainer.scrollHeight - 1;
}

function scroll(direction: -1 | 1) {
	if (!scrollContainer) return;
	scrollContainer.scrollBy({ top: direction * scrollContainer.clientHeight * 0.6, behavior: "smooth" });
}

function onPointerDown(e: PointerEvent) {
	if (isWrapping) return;
	isDragging = true;
	wasDragged = false;
	dragStartY = e.clientY;
	scrollStartTop = scrollContainer.scrollTop;
}

function onPointerMove(e: PointerEvent) {
	if (!isDragging) return;
	const dy = e.clientY - dragStartY;
	scrollContainer.scrollTop = scrollStartTop - dy;
	if (Math.abs(dy) > 5) wasDragged = true;
}

function onPointerUp() {
	isDragging = false;
	setTimeout(() => {
		wasDragged = false;
	});
}

function applyStylishOffsets() {
	if (alignment !== "stylish" || !scrollContainer || !isWrapping) return;
	const children = Array.from(scrollContainer.children) as HTMLElement[];
	if (children.length === 0) return;

	let currentRowTop = children[0].offsetTop;
	let rowIndex = 0;

	for (const child of children) {
		if (Math.abs(child.offsetTop - currentRowTop) > 5) {
			rowIndex++;
			currentRowTop = child.offsetTop;
		}
		child.style.transform = rowIndex % 2 === 1 ? "translateX(1.5rem)" : "";
	}
}

$effect(() => {
	if (!scrollContainer) return;
	updateArrows();
	const observer = new ResizeObserver(() => {
		updateArrows();
		applyStylishOffsets();
	});
	observer.observe(scrollContainer);
	return () => observer.disconnect();
});

$effect(() => {
	if (!scrollContainer || !isWrapping || alignment !== "stylish") return;
	const imgs = scrollContainer.querySelectorAll("img");
	let loaded = 0;
	const total = imgs.length;
	if (total === 0) return;

	function onLoad() {
		loaded++;
		if (loaded >= total) applyStylishOffsets();
	}

	for (const img of imgs) {
		if (img.complete) {
			loaded++;
		} else {
			img.addEventListener("load", onLoad, { once: true });
		}
	}
	if (loaded >= total) applyStylishOffsets();
});

$effect(() => {
	if (!scrollContainer) return;
	void images;
	const zoom = mediumZoom(scrollContainer.querySelectorAll("img"), {
		background: "rgba(0, 0, 0, 0.85)",
		margin: 24,
	});
	return () => zoom.detach();
});

$effect(() => {
	if (!scrollContainer || isWrapping) return;
	function onClickCapture(e: MouseEvent) {
		if (wasDragged) {
			e.stopPropagation();
			wasDragged = false;
		}
	}
	scrollContainer.addEventListener("click", onClickCapture, { capture: true });
	return () => scrollContainer.removeEventListener("click", onClickCapture, { capture: true });
});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative group" class:h-full={!isWrapping}>
	{#if canScrollUp && !isWrapping}
		<button
			class="absolute top-0 left-0 right-0 z-10 h-10 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
			onclick={() => scroll(-1)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
			</svg>
		</button>
	{/if}

	<div
		bind:this={scrollContainer}
		class="flex gap-3 scrollbar-hide items-center"
		class:flex-col={!isWrapping}
		class:overflow-y-auto={!isWrapping}
		class:h-full={!isWrapping}
		class:flex-row={isWrapping}
		class:flex-wrap={isWrapping}
		class:overflow-hidden={isWrapping}
		class:justify-center={isWrapping && !canScrollUp && !canScrollDown}
		class:justify-start={isWrapping && (canScrollUp || canScrollDown)}
		class:cursor-grab={!isDragging && !isWrapping}
		class:cursor-grabbing={isDragging}
		style:max-height={isWrapping ? `calc(${maxRows} * ${imageHeight} + ${maxRows - 1} * 0.75rem)` : undefined}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onscroll={updateArrows}
	>
		{#each images as src, i}
			<img
				class="rounded-lg object-cover shrink-0 select-none transition-transform duration-200"
				style:width={isWrapping ? imageHeight : imageWidth}
				style:height={isWrapping ? imageHeight : undefined}
				{src}
				alt="Gallery {i + 1}"
				draggable="false"
			/>
		{/each}
	</div>

	{#if canScrollDown && !isWrapping}
		<button
			class="absolute bottom-0 left-0 right-0 z-10 h-10 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
			onclick={() => scroll(1)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	{/if}
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
