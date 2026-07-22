<script lang="ts">
	import mediumZoom from 'medium-zoom';
	type Props = {
		images: string[];
		imageWidth?: string;
	};

	let { images, imageWidth = '100%' }: Props = $props();
	let scrollContainer: HTMLDivElement;
	let isDragging = $state(false);
	let wasDragged = false;
	let dragStartY = 0;
	let scrollStartTop = 0;
	let canScrollUp = $state(false);
	let canScrollDown = $state(false);

	function updateArrows() {
		if (!scrollContainer) return;
		canScrollUp = scrollContainer.scrollTop > 0;
		canScrollDown = scrollContainer.scrollTop + scrollContainer.clientHeight < scrollContainer.scrollHeight - 1;
	}

	function scroll(direction: -1 | 1) {
		scrollContainer.scrollBy({ top: direction * scrollContainer.clientHeight * 0.6, behavior: 'smooth' });
	}

	function onPointerDown(e: PointerEvent) {
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
		setTimeout(() => { wasDragged = false; });
	}

	$effect(() => {
		if (!scrollContainer) return;
		updateArrows();
		const observer = new ResizeObserver(updateArrows);
		observer.observe(scrollContainer);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!scrollContainer) return;
		void images;
		const zoom = mediumZoom(scrollContainer.querySelectorAll('img'), {
			background: 'rgba(0, 0, 0, 0.85)',
			margin: 24,
		});
		return () => zoom.detach();
	});

	$effect(() => {
		if (!scrollContainer) return;
		function onClickCapture(e: MouseEvent) {
			if (wasDragged) {
				e.stopPropagation();
				wasDragged = false;
			}
		}
		scrollContainer.addEventListener('click', onClickCapture, { capture: true });
		return () => scrollContainer.removeEventListener('click', onClickCapture, { capture: true });
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative group h-full">
	{#if canScrollUp}
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
		class="flex flex-col gap-3 overflow-y-auto h-full scrollbar-hide items-center"
		class:cursor-grab={!isDragging}
		class:cursor-grabbing={isDragging}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onscroll={updateArrows}
	>
		{#each images as src, i}
			<img
				class="rounded-lg object-cover shrink-0 select-none"
				style:width={imageWidth}
				{src}
				alt="Gallery {i + 1}"
				draggable="false"
			/>
		{/each}
	</div>

	{#if canScrollDown}
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
