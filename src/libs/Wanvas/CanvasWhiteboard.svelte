<script lang="ts">
/**
 * @module CanvasWhiteboard
 * @description A fully encapsulated, portable, zoomable, and pannable 2D canvas workspace for Svelte 5.
 * @author Kristan
 * @license MIT
 */

import { onDestroy, onMount } from 'svelte';
import type { CanvasNodeData, CanvasPersistence, CanvasProps } from './Canvas.types';
import { dragNode, observeSize, resizeNode } from './CanvasActions';
import { calculateZoomOffset, clampX, clampY, clampZoom, getTouchCenter, getTouchDistance } from './CanvasMath';
import { loadPersistentState, savePersistentState } from './CanvasPersistence';

export type { CanvasNodeData, CanvasPersistence, CanvasProps };

let {
	x = $bindable(0),
	y = $bindable(0),
	zoom = $bindable(1),
	minZoom = 0.15,
	maxZoom = 8.0,
	zoomSpeed = 0.0015,
	infinite = true,
	limitXMin = -5000,
	limitXMax = 5000,
	limitYMin = -5000,
	limitYMax = 5000,

	resizable = true,
	nodes = $bindable([]),
	dragHandleClass = '',
	onNodeChange,
	classNames = {},
	class: className = '',
	style = '',
	bgColor = '#242424',
	dotColor = 'rgb(58, 58, 58)',
	dotSize = 1.5,
	showDots = true,
	children,
	controls,
	registry = {},
	persistence = $bindable({ key: 'canvas-persistence-default' } as CanvasPersistence | null),
	wrapperEl = $bindable(null),
}: CanvasProps = $props();

// ponytail: consolidated reactive canvas limits configuration
const limits = $derived({
	minZoom,
	maxZoom,
	zoomSpeed,
	infinite,
	limitXMin,
	limitXMax,
	limitYMin,
	limitYMax,
});

// Internal references
let isPanning = $state(false);

const isPersistenceEnabled = $derived(persistence !== null && (persistence.key !== 'canvas-persistence-default' || !onNodeChange));

// Drag variables
let startMousePos = { x: 0, y: 0 };
let startPanPos = { x: 0, y: 0 };
let panButton = -1;

// Touch gesture variables
let touchStartDist = 0;
let touchStartZoom = 1;
let touchStartCenter = { x: 0, y: 0 };
let lastTouchPos = { x: 0, y: 0 };

// Set initial position to center when wrapper element mounts
onMount(() => {
	let hasSavedView = false;
	if (isPersistenceEnabled && persistence?.key) {
		const state = loadPersistentState(persistence.key);
		if (state.nodes !== null) {
			nodes = state.nodes;
		}
		if (state.view) {
			x = state.view.x;
			y = state.view.y;
			zoom = state.view.zoom;
			hasSavedView = true;
		}
	}

	if (!hasSavedView && wrapperEl && x === 0 && y === 0) {
		const rect = wrapperEl.getBoundingClientRect();
		x = rect.width / 2;
		y = rect.height / 2;
	}
});

// Ensure all nodes have a unique ID and a layer index reactively
$effect.pre(() => {
	let changed = false;

	// First check layer values and throw error if negative
	for (const node of nodes) {
		if (node.layer !== undefined && node.layer < 0) {
			throw new Error('Layer index must be non-negative');
		}
	}

	// Calculate maximum layer index currently present on any node
	let maxLayer = -1;
	for (const node of nodes) {
		if (node.layer !== undefined && node.layer > maxLayer) {
			maxLayer = node.layer;
		}
	}

	const sanitized = nodes.map((node) => {
		let nodeChanged = false;
		let id = node.id;
		if (!id) {
			id = crypto.randomUUID();
			nodeChanged = true;
		}

		let layer = node.layer;
		if (layer === undefined) {
			maxLayer = maxLayer + 1;
			layer = maxLayer;
			nodeChanged = true;
		}

		if (nodeChanged) {
			changed = true;
			return { ...node, id, layer };
		}
		return node;
	});

	if (changed) {
		nodes = sanitized;
	}
});

function bringToTop(node: CanvasNodeData, target?: HTMLElement) {
	if (target?.closest('.canvas-node-close-button')) return;
	const maxLayer = Math.max(0, ...nodes.map((n) => n.layer ?? 0));
	if (node.layer !== maxLayer) {
		node.layer = maxLayer + 1;
		triggerChange();
	}
}

// Persist viewport changes (pan and zoom) reactively
$effect(() => {
	if (isPersistenceEnabled && (x !== undefined || y !== undefined || zoom !== undefined)) {
		triggerChange();
	}
});

// Helper to detect interactive elements so we don't accidentally pan
function isInteractive(target: HTMLElement | null): boolean {
	if (!target) return false;
	let current: HTMLElement | null = target;
	while (current && current !== wrapperEl) {
		if (current.hasAttribute('data-canvas-is-draggable')) {
			return false;
		}
		const tagName = current.tagName;
		if (
			tagName === 'INPUT' ||
			tagName === 'TEXTAREA' ||
			tagName === 'SELECT' ||
			tagName === 'BUTTON' ||
			tagName === 'A' ||
			current.classList.contains('interactive') ||
			current.classList.contains('no-pan') ||
			current.getAttribute('role') === 'button'
		) {
			return true;
		}
		current = current.parentElement;
	}
	return false;
}

// Wheel zoom handler
function handleWheel(e: WheelEvent) {
	if (!wrapperEl) return;

	// Calculate mouse position relative to wrapper element
	const rect = wrapperEl.getBoundingClientRect();
	const mx = e.clientX - rect.left;
	const my = e.clientY - rect.top;

	const oldZoom = zoom;
	const factor = Math.exp(-e.deltaY * zoomSpeed);
	const newZoom = clampZoom(zoom * factor, limits);

	if (newZoom === oldZoom) return;

	// Zoom relative to the cursor position
	const newPos = calculateZoomOffset({ x: mx, y: my }, { x, y }, newZoom / oldZoom, limits);
	zoom = newZoom;
	x = newPos.x;
	y = newPos.y;
}

// Effect to attach wheel handler with passive: false to allow e.preventDefault()
$effect(() => {
	if (!wrapperEl) return;
	const element = wrapperEl;
	const onWheel = (e: WheelEvent) => {
		e.preventDefault();
		handleWheel(e);
	};
	element.addEventListener('wheel', onWheel, { passive: false });
	return () => {
		element.removeEventListener('wheel', onWheel);
	};
});

// Mouse drag handlers
function handleMouseDown(e: MouseEvent) {
	const isMiddle = e.button === 1;
	const isRight = e.button === 2;

	if (!isMiddle && !isRight) {
		// Left click only drags if not on an interactive element
		if (isInteractive(e.target as HTMLElement)) return;
	}

	if (isRight) {
		e.preventDefault();
	}

	isPanning = true;
	panButton = e.button;
	startMousePos = { x: e.clientX, y: e.clientY };
	startPanPos = { x, y };
}

function handleMouseMove(e: MouseEvent) {
	if (!isPanning) return;

	const dx = e.clientX - startMousePos.x;
	const dy = e.clientY - startMousePos.y;

	x = clampX(startPanPos.x + dx, limits);
	y = clampY(startPanPos.y + dy, limits);
}

// Global mouse up handler
function handleMouseUp(e: MouseEvent) {
	if (isPanning && e.button === panButton) {
		isPanning = false;
		panButton = -1;
	}
}

function handleContextMenu(e: MouseEvent) {
	if (panButton === 2) {
		e.preventDefault();
	}
}

// Double click reset
function handleDoubleClick(_e: MouseEvent) {
	// double-click reset intentionally disabled
}

// Touch triggers
function handleTouchStart(e: TouchEvent) {
	if (!wrapperEl) return;
	const rect = wrapperEl.getBoundingClientRect();

	if (e.touches.length === 1) {
		if (isInteractive(e.target as HTMLElement)) return;
		isPanning = true;
		lastTouchPos = {
			x: e.touches[0].clientX,
			y: e.touches[0].clientY,
		};
	} else if (e.touches.length === 2) {
		isPanning = false;
		const t1 = e.touches[0];
		const t2 = e.touches[1];
		touchStartDist = getTouchDistance(t1, t2);
		touchStartZoom = zoom;
		touchStartCenter = getTouchCenter(t1, t2, rect);
	}
}

function handleTouchMove(e: TouchEvent) {
	if (!wrapperEl) return;

	if (e.touches.length === 1 && isPanning) {
		e.preventDefault();
		const t = e.touches[0];
		const dx = t.clientX - lastTouchPos.x;
		const dy = t.clientY - lastTouchPos.y;

		x = clampX(x + dx, limits);
		y = clampY(y + dy, limits);
		lastTouchPos = { x: t.clientX, y: t.clientY };
	} else if (e.touches.length === 2) {
		e.preventDefault();
		const t1 = e.touches[0];
		const t2 = e.touches[1];

		const rect = wrapperEl.getBoundingClientRect();
		const currentDist = getTouchDistance(t1, t2);
		const currentCenter = getTouchCenter(t1, t2, rect);

		if (touchStartDist > 0) {
			const scale = currentDist / touchStartDist;
			const newZoom = clampZoom(touchStartZoom * scale, limits);

			const ratio = newZoom / zoom;
			const nextX = touchStartCenter.x - (touchStartCenter.x - x) * ratio + (currentCenter.x - touchStartCenter.x);
			const nextY = touchStartCenter.y - (touchStartCenter.y - y) * ratio + (currentCenter.y - touchStartCenter.y);

			zoom = newZoom;
			x = clampX(nextX, limits);
			y = clampY(nextY, limits);

			touchStartDist = currentDist;
			touchStartZoom = zoom;
			touchStartCenter = currentCenter;
		}
	}
}

function handleTouchEnd(e: TouchEvent) {
	if (e.touches.length === 0) {
		isPanning = false;
		touchStartDist = 0;
	} else if (e.touches.length === 1) {
		isPanning = true;
		lastTouchPos = {
			x: e.touches[0].clientX,
			y: e.touches[0].clientY,
		};
		touchStartDist = 0;
	}
}

let changeTimeout: ReturnType<typeof setTimeout>;

/**
 * Dispatches the changes callback, debounced to prevent spamming
 * multiple layout updates in the same tick.
 */
function triggerChange() {
	if (!onNodeChange && !isPersistenceEnabled) return;

	clearTimeout(changeTimeout);
	changeTimeout = setTimeout(() => {
		const serialized = nodes.map((n) => ({
			id: n.id,
			type: n.type,
			props: n.props ? JSON.parse(JSON.stringify(n.props)) : {},
			x: n.x,
			y: n.y,
			width: n.width,
			height: n.height,
			layer: n.layer,
			isPinned: n.isPinned,
			keepAspectRatio: n.keepAspectRatio,
		})) as unknown as CanvasNodeData[];

		let cancelled = false;
		const cancel = () => {
			cancelled = true;
		};

		if (isPersistenceEnabled && persistence?.beforeSave) {
			persistence.beforeSave(serialized, cancel);
		}

		if (cancelled) return;

		if (isPersistenceEnabled && persistence?.key) {
			savePersistentState(persistence.key, serialized, { x, y, zoom });
		}

		if (onNodeChange) {
			onNodeChange(serialized);
		}

		if (isPersistenceEnabled && persistence?.afterSave) {
			persistence.afterSave(serialized);
		}
	}, 250);
}

onDestroy(() => {
	if (changeTimeout) clearTimeout(changeTimeout);
});
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={wrapperEl}
  class="canvas-wrapper {className} {classNames.wrapper ?? ''}"
  class:panning={isPanning}
  onmousedown={handleMouseDown}
  oncontextmenu={handleContextMenu}
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
  ondblclick={handleDoubleClick}
  style="--canvas-bg-color: {bgColor}; --canvas-dot-color: {dotColor}; --canvas-dot-size: {dotSize}px; --canvas-bg-image: {showDots ? 'radial-gradient(circle, var(--canvas-dot-color) var(--canvas-dot-size), transparent var(--canvas-dot-size))' : 'none'}; {style}; background-size: {50 * zoom}px {50 * zoom}px; background-position: {x}px {y}px;"
>
  <div
    class="canvas-content {classNames.content ?? ''}"
    style="transform: translate({x}px, {y}px) scale({zoom});"
  >
    <!-- Render Static Children Snippets -->
    {#if children}
      {@render children()}
    {/if}

    <!-- Render Dynamic Serializable Nodes -->
    {#each nodes as node (node.id)}
      {@const Component = registry[node.type]}
      {#if Component}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="canvas-node-wrapper"
          class:pinned={node.isPinned}
          style="left: {node.x}px; top: {node.y}px; width: {node.width
            ? node.width + 'px'
            : 'auto'}; height: {node.height ? node.height + 'px' : 'auto'}; z-index: {node.layer};"
          onpointerdown={(e) => bringToTop(node, e.target as HTMLElement)}
          use:dragNode={{
            node,
            getZoom: () => zoom,
            getDragHandleClass: () => dragHandleClass,
            isInteractive,
            triggerChange
          }}
          use:observeSize={{
            node,
            triggerChange
          }}
        >
          <Component 
            {...node.props || {}} 
            onChange={(updatedProps: any) => {
              node.props = { ...node.props, ...updatedProps };
              triggerChange();
            }}
          />

          <button
            type="button"
            class="canvas-node-close-button"
            onclick={(e) => {
              e.stopPropagation();
              nodes = nodes.filter((n) => n.id !== node.id);
              triggerChange();
            }}
            title="Delete Node"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <button
            type="button"
            class="canvas-node-pin-button"
            class:pinned={node.isPinned}
            onclick={(e) => {
              e.stopPropagation();
              node.isPinned = !node.isPinned;
              triggerChange();
            }}
            title={node.isPinned ? "Unpin Node" : "Pin Node"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={node.isPinned ? "currentColor" : "none"}
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon"
              style="transform: rotate({node.isPinned ? '0deg' : '45deg'}); transition: transform 0.2s;"
            >
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.48A2 2 0 0 1 15 9.28V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4.28c0 .4-.12.8-.38 1.1l-2.78 3.48a2 2 0 0 0-.44 1.24Z"></path>
            </svg>
          </button>

          <!-- nwse-resize handle rendered if resizable is true -->
          {#if resizable}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="canvas-node-resize-handle" use:resizeNode={{
              node,
              getZoom: () => zoom,
              triggerChange
            }}
            onpointerdown={(e) => bringToTop(node, e.target as HTMLElement)}
            ></div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  {#if controls}
    {@render controls()}
  {/if}
</div>

<style>
  :where(.canvas-wrapper) {
    width: 100%;
    height: 100%;
  }

  .canvas-wrapper {
    position: relative;
    overflow: hidden;

    background-color: var(--canvas-bg-color, #242424);
    background-image: var(--canvas-bg-image, radial-gradient(
      circle,
      var(--canvas-dot-color, rgb(58, 58, 58)) var(--canvas-dot-size, 1.5px),
      transparent var(--canvas-dot-size, 1.5px)
    ));
    background-repeat: repeat;

    cursor: grab;
    user-select: none;
    touch-action: none;

    display: flex;
    align-items: stretch;
    justify-content: stretch;
  }

  .canvas-wrapper.panning {
    cursor: grabbing;
  }

  .canvas-content {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    pointer-events: auto;
    width: 0;
    height: 0;
  }

  .canvas-node-wrapper {
    position: absolute;
    cursor: move;
    touch-action: none;
    user-select: none;
    display: block;
  }

  .canvas-node-wrapper.pinned,
  .canvas-node-wrapper.pinned :global(.drag-handle) {
    cursor: default !important;
  }

  .canvas-node-close-button {
    position: absolute;
    top: 8px;
    right: 40px;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: rgba(30, 30, 32, 0.75);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #b0b0b0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 15;
    opacity: 0;
    transition: opacity 0.15s, background 0.15s, color 0.15s, transform 0.15s;
    padding: 0;
  }

  .canvas-node-wrapper:hover .canvas-node-close-button {
    opacity: 1;
  }

  .canvas-node-close-button:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: #ef4444;
    transform: scale(1.05);
  }

  .canvas-node-close-button:active {
    transform: scale(0.95);
  }

  .canvas-node-pin-button {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: rgba(30, 30, 32, 0.75);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #b0b0b0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 15;
    opacity: 0;
    transition: opacity 0.15s, background 0.15s, color 0.15s, transform 0.15s;
    padding: 0;
  }

  .canvas-node-wrapper:hover .canvas-node-pin-button {
    opacity: 1;
  }

  .canvas-node-wrapper.pinned .canvas-node-pin-button {
    opacity: 1;
    color: #a855f7;
    background: rgba(30, 30, 32, 0.85);
    border-color: rgba(168, 85, 247, 0.4);
  }

  .canvas-node-pin-button:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    transform: scale(1.05);
  }

  .canvas-node-pin-button:active {
    transform: scale(0.95);
  }

  .canvas-node-pin-button.pinned:hover {
    color: #c084fc;
  }

  /* Diagonal resize corner styling */
  .canvas-node-resize-handle {
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 10px;
    height: 10px;
    cursor: nwse-resize;
    z-index: 10;
    border-right: 2px solid rgba(255, 255, 255, 0.4);
    border-bottom: 2px solid rgba(255, 255, 255, 0.4);
    opacity: 0;
    transition: opacity 0.15s, border-color 0.15s;
  }

  .canvas-node-wrapper:hover .canvas-node-resize-handle {
    opacity: 1;
  }

  .canvas-node-resize-handle:hover {
    border-color: rgba(147, 51, 234, 0.8);
  }

  /* Reset hover cursor for interactive child items */
  .canvas-wrapper :global(.interactive),
  .canvas-wrapper :global(button),
  .canvas-wrapper :global(input),
  .canvas-wrapper :global(a) {
    cursor: auto;
  }
  .canvas-wrapper :global(button),
  .canvas-wrapper :global(a) {
    cursor: pointer;
  }

  .icon {
    width: 15px;
    height: 15px;
  }
</style>
