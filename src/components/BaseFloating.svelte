<script lang="ts">
import type { Snippet } from "svelte";

type Props = {
	/** Mandatory stacking order z-index for floating overlay components. */
	zIndex: number;
	title?: string;
	children?: Snippet;
	initialX?: number;
	initialY?: number;
	class?: string;
};

let { zIndex, title = "Widget", children, initialX = 24, initialY = 24, class: customClass = "" }: Props = $props();

let offsetX = $state(0);
let offsetY = $state(0);
let isDragging = $state(false);
let isCollapsed = $state(false);

let startPointerX = 0;
let startPointerY = 0;
let startOffsetX = 0;
let startOffsetY = 0;

function handlePointerDown(e: PointerEvent) {
	if (e.button !== 0) return;
	isDragging = true;
	startPointerX = e.clientX;
	startPointerY = e.clientY;
	startOffsetX = offsetX;
	startOffsetY = offsetY;

	const target = e.currentTarget as HTMLElement;
	target.setPointerCapture(e.pointerId);
}

function handlePointerMove(e: PointerEvent) {
	if (!isDragging) return;
	const deltaX = e.clientX - startPointerX;
	const deltaY = e.clientY - startPointerY;
	offsetX = startOffsetX + deltaX;
	offsetY = startOffsetY + deltaY;
}

function handlePointerUp(e: PointerEvent) {
	if (!isDragging) return;
	isDragging = false;
	const target = e.currentTarget as HTMLElement;
	try {
		target.releasePointerCapture(e.pointerId);
	} catch {
		// Ignore if pointer capture already released
	}
}

function toggleCollapse() {
	isCollapsed = !isCollapsed;
}
</script>

<div
  class="fixed pointer-events-auto select-none rounded-xl border border-zinc-800/90 bg-zinc-950/85 p-3 shadow-2xl backdrop-blur-lg transition-shadow duration-200 hover:border-zinc-700 {customClass}"
  style:z-index={zIndex}
  style:top="{initialY}px"
  style:right="{initialX}px"
  style:transform="translate({offsetX}px, {offsetY}px)"
>
  <!-- DRAG HEADER BAR -->
  <div
    class="flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing border-b border-zinc-800/80 pb-2 mb-2"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
  >
    <div class="flex items-center gap-2">
      <!-- Drag Grip Handle Icon -->
      <svg class="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
      </svg>
      <span class="text-xs font-bold uppercase tracking-wider text-zinc-300">
        {title}
      </span>
    </div>

    <!-- Collapse / Expand Toggle -->
    <button
      type="button"
      onclick={toggleCollapse}
      class="text-zinc-500 hover:text-white transition-colors p-0.5 rounded"
      aria-label={isCollapsed ? "Expand widget" : "Collapse widget"}
    >
      {#if isCollapsed}
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      {:else}
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      {/if}
    </button>
  </div>

  <!-- CONTENT BODY -->
  {#if !isCollapsed}
    <div class="space-y-2">
      {@render children?.()}
    </div>
  {/if}
</div>
