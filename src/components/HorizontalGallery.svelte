<script lang="ts">
import mediumZoom from "medium-zoom";

type Props = {
	images: string[];
	imageHeight?: string;
	maxRows?: number;
	alignment?: "center" | "stylish";
};

let { images, imageHeight = "12rem", maxRows = 1, alignment = "center" }: Props = $props();
let container: HTMLDivElement;
let isDragging = $state(false);
let canScrollLeft = $state(false);
let canScrollRight = $state(false);
let wasDragged = false;
let dragStartX = 0;
let scrollStartLeft = 0;

const isWrapping = $derived(maxRows > 1);

function updateArrows() {
	if (!container || isWrapping) {
		canScrollLeft = false;
		canScrollRight = false;
		return;
	}
	canScrollLeft = container.scrollLeft > 1;
	canScrollRight = container.scrollLeft + container.clientWidth < container.scrollWidth - 1;
}

function scroll(direction: -1 | 1) {
	if (!container) return;
	container.scrollBy({ left: direction * container.clientWidth * 0.6, behavior: "smooth" });
}

function applyStylishOffsets() {
	if (alignment !== "stylish" || !container || !isWrapping) return;
	const children = Array.from(container.children) as HTMLElement[];
	let currentRowTop = children[0]?.offsetTop ?? 0;
	let rowIndex = 0;

	for (const child of children) {
		if (Math.abs(child.offsetTop - currentRowTop) > 5) {
			rowIndex++;
			currentRowTop = child.offsetTop;
		}
		child.style.transform = rowIndex % 2 === 1 ? "translateX(1.5rem)" : "";
	}
}

function onPointerDown(e: PointerEvent) {
	if (isWrapping || e.button !== 0) return;
	isDragging = true;
	wasDragged = false;
	dragStartX = e.clientX;
	scrollStartLeft = container.scrollLeft;
}

function onPointerMove(e: PointerEvent) {
	if (!isDragging || !container) return;
	const dx = e.clientX - dragStartX;
	if (Math.abs(dx) > 5) wasDragged = true;
	container.scrollLeft = scrollStartLeft - dx;
}

function onPointerUp() {
	isDragging = false;
}

$effect(() => {
	if (!container) return;
	void images;
	updateArrows();
	applyStylishOffsets();

	const observer = new ResizeObserver(() => {
		updateArrows();
		applyStylishOffsets();
	});
	observer.observe(container);

	const zoom = mediumZoom(container.querySelectorAll("img"), {
		background: "rgba(0, 0, 0, 0.85)",
		margin: 24,
	});

	function onClickCapture(e: MouseEvent) {
		if (wasDragged) {
			e.stopPropagation();
			wasDragged = false;
		}
	}

	container.addEventListener("click", onClickCapture, { capture: true });

	return () => {
		observer.disconnect();
		zoom.detach();
		container.removeEventListener("click", onClickCapture, { capture: true });
	};
});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative group">
	{#if canScrollLeft}
		<button
			type="button"
			aria-label="Scroll left"
			class="absolute left-0 top-0 bottom-0 z-100 w-10 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-l-lg"
			onclick={() => scroll(-1)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
	{/if}

	<div
		bind:this={container}
		class="flex gap-3 scrollbar-hide"
		class:overflow-x-auto={!isWrapping}
		class:flex-wrap={isWrapping}
		class:overflow-hidden={isWrapping}
		class:cursor-grab={!isDragging && !isWrapping}
		class:cursor-grabbing={isDragging}
		style:max-height={isWrapping ? `calc(${maxRows} * ${imageHeight} + ${maxRows - 1} * 0.75rem)` : undefined}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onscroll={updateArrows}
	>
		{#each images as src, i}
			<img
				class="rounded-lg object-cover shrink-0 select-none transition-transform duration-200 z-90"
				style:height={imageHeight}
				{src}
				alt="Gallery {i + 1}"
				draggable="false"
				onload={updateArrows}
				onerror={updateArrows}
			/>
		{/each}
	</div>

	{#if canScrollRight}
		<button
			type="button"
			aria-label="Scroll right"
			class="absolute right-0 top-0 bottom-0 z-100 w-10 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-r-lg"
			onclick={() => scroll(1)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
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
