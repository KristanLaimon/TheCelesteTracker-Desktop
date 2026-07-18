<script lang="ts" generics="Registry extends CanvasRegistry = CanvasRegistry">
/**
 * @module Canvas
 * @description A fully encapsulated, portable, zoomable, and pannable 2D canvas workspace for Svelte 5.
 * @author Kristan
 * @license MIT
 */

import { onDestroy, onMount } from 'svelte';
import { Log_Warn } from '../Logger';
import type { CanvasNodeData, CanvasPersistence, CanvasProps, CanvasRegistry } from './Canvas.types';

export type { CanvasNodeData, CanvasPersistence, CanvasProps, CanvasRegistry };

// CanvasNodeData is now imported from Canvas.types.ts to support mapped union types.

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

	showControls = true,
	resizable = true,
	nodes = $bindable([]),
	registry = {} as Registry,
	dragHandleClass = '',
	onNodeChange,
	classNames = {},
	class: className = '',
	style = '',
	bgColor = '#242424',
	dotColor = 'rgb(58, 58, 58)',
	dotSize = 1.5,
	showDots = true,
	mode = 'normal',
	children,
	persistence = $bindable({ key: 'canvas-persistence-default' } as CanvasPersistence<Registry> | null),
}: CanvasProps<Registry> = $props();

// Internal references
let wrapperEl = $state<HTMLDivElement | null>(null);
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
		const nodesStorage = localStorage.getItem(`${persistence.key}_nodes`);
		const viewStorage = localStorage.getItem(`${persistence.key}_view`);
		let loadedNodes: CanvasNodeData<Registry>[] | null = null;

		if (nodesStorage) {
			try {
				loadedNodes = JSON.parse(nodesStorage);
			} catch (err) {
				Log_Warn(`Canvas -> Failed to parse persistent nodes: ${err}`);
			}
		}

		if (viewStorage) {
			try {
				const parsedView = JSON.parse(viewStorage);
				if (parsedView) {
					const vx = Number(parsedView.x);
					const vy = Number(parsedView.y);
					const vz = Number(parsedView.zoom);
					if (!Number.isNaN(vx) && Number.isFinite(vx)) x = vx;
					if (!Number.isNaN(vy) && Number.isFinite(vy)) y = vy;
					if (!Number.isNaN(vz) && Number.isFinite(vz) && vz > 0) {
						zoom = vz;
						hasSavedView = true;
					}
				}
			} catch (err) {
				Log_Warn(`Canvas -> Failed to parse persistent view: ${err}`);
			}
		}

		// Fallback for backward compatibility (single key payload)
		if (!nodesStorage && !viewStorage) {
			const storage = localStorage.getItem(persistence.key);
			if (storage) {
				try {
					const parsed = JSON.parse(storage);
					if (Array.isArray(parsed)) {
						loadedNodes = parsed as CanvasNodeData<Registry>[];
					} else if (parsed && typeof parsed === 'object') {
						loadedNodes = (parsed.nodes || []) as CanvasNodeData<Registry>[];
						if (parsed.view) {
							const vx = Number(parsed.view.x);
							const vy = Number(parsed.view.y);
							const vz = Number(parsed.view.zoom);
							if (!Number.isNaN(vx) && Number.isFinite(vx)) x = vx;
							if (!Number.isNaN(vy) && Number.isFinite(vy)) y = vy;
							if (!Number.isNaN(vz) && Number.isFinite(vz) && vz > 0) {
								zoom = vz;
								hasSavedView = true;
							}
						}
					}
				} catch (err) {
					Log_Warn(`Canvas -> Failed to parse fallback persistent storage: ${err}`);
				}
			}
		}

		// Sanitize loaded nodes
		if (loadedNodes !== null) {
			nodes = loadedNodes.map((node) => {
				if (!node.id) node.id = crypto.randomUUID();
				if (typeof node.x !== 'number' || !Number.isFinite(node.x)) node.x = 0;
				if (typeof node.y !== 'number' || !Number.isFinite(node.y)) node.y = 0;
				if (node.width !== undefined && (typeof node.width !== 'number' || !Number.isFinite(node.width))) {
					node.width = undefined;
				}
				if (node.height !== undefined && (typeof node.height !== 'number' || !Number.isFinite(node.height))) {
					node.height = undefined;
				}
				return node;
			});
		}
	}

	if (!hasSavedView && wrapperEl && x === 0 && y === 0) {
		const rect = wrapperEl.getBoundingClientRect();
		x = rect.width / 2;
		y = rect.height / 2;
	}
});

// Ensure all nodes have a unique ID reactively
$effect.pre(() => {
	let changed = false;
	const sanitized = nodes.map((node) => {
		if (!node.id) {
			changed = true;
			return { ...node, id: crypto.randomUUID() };
		}
		return node;
	});
	if (changed) {
		nodes = sanitized;
	}
});

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
		if (current.classList.contains('no-interactive')) {
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
	let newZoom = zoom * factor;
	newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

	if (newZoom === oldZoom) return;

	// Zoom relative to the cursor position
	let newX = mx - (mx - x) * (newZoom / oldZoom);
	let newY = my - (my - y) * (newZoom / oldZoom);

	if (!infinite) {
		newX = Math.max(limitXMin, Math.min(limitXMax, newX));
		newY = Math.max(limitYMin, Math.min(limitYMax, newY));
	}

	zoom = newZoom;
	x = newX;
	y = newY;
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

	let newX = startPanPos.x + dx;
	let newY = startPanPos.y + dy;

	if (!infinite) {
		newX = Math.max(limitXMin, Math.min(limitXMax, newX));
		newY = Math.max(limitYMin, Math.min(limitYMax, newY));
	}

	x = newX;
	y = newY;
}

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

// Touch handlers
function getTouchDistance(t1: Touch, t2: Touch) {
	return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

function getTouchCenter(t1: Touch, t2: Touch, rect: DOMRect) {
	return {
		x: (t1.clientX + t2.clientX) / 2 - rect.left,
		y: (t1.clientY + t2.clientY) / 2 - rect.top,
	};
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

		let newX = x + dx;
		let newY = y + dy;

		if (!infinite) {
			newX = Math.max(limitXMin, Math.min(limitXMax, newX));
			newY = Math.max(limitYMin, Math.min(limitYMax, newY));
		}

		x = newX;
		y = newY;
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
			let newZoom = touchStartZoom * scale;
			newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

			const s = zoom;
			const sPrime = newZoom;
			const cx = touchStartCenter.x;
			const cy = touchStartCenter.y;

			let nextX = cx - (cx - x) * (sPrime / s);
			let nextY = cy - (cy - y) * (sPrime / s);

			// Center shift
			const centerDx = currentCenter.x - touchStartCenter.x;
			const centerDy = currentCenter.y - touchStartCenter.y;
			nextX += centerDx;
			nextY += centerDy;

			if (!infinite) {
				nextX = Math.max(limitXMin, Math.min(limitXMax, nextX));
				nextY = Math.max(limitYMin, Math.min(limitYMax, nextY));
			}

			zoom = newZoom;
			x = nextX;
			y = nextY;

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

// Zoom control panel actions
function zoomAtCenter(multiplier: number) {
	if (!wrapperEl) return;
	const rect = wrapperEl.getBoundingClientRect();
	const cx = rect.width / 2;
	const cy = rect.height / 2;

	const oldZoom = zoom;
	let newZoom = zoom * multiplier;
	newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

	if (newZoom === oldZoom) return;

	let newX = cx - (cx - x) * (newZoom / oldZoom);
	let newY = cy - (cy - y) * (newZoom / oldZoom);

	if (!infinite) {
		newX = Math.max(limitXMin, Math.min(limitXMax, newX));
		newY = Math.max(limitYMin, Math.min(limitYMax, newY));
	}

	zoom = newZoom;
	x = newX;
	y = newY;
}

function zoomIn() {
	zoomAtCenter(1.25);
}

function zoomOut() {
	zoomAtCenter(1 / 1.25);
}

function resetView() {
	if (!wrapperEl) return;
	const rect = wrapperEl.getBoundingClientRect();
	zoom = 1.0;
	x = rect.width / 2;
	y = rect.height / 2;
}

// --- Svelte Actions for Node Dragging & Size Observation ---

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
			x: n.x,
			y: n.y,
			width: n.width,
			height: n.height,
			props: n.props ? JSON.parse(JSON.stringify(n.props)) : {},
		})) as unknown as CanvasNodeData<Registry>[];

		let cancelled = false;
		const cancel = () => {
			cancelled = true;
		};

		if (isPersistenceEnabled && persistence?.beforeSave) {
			persistence.beforeSave(serialized, cancel);
		}

		if (cancelled) return;

		if (isPersistenceEnabled && persistence?.key) {
			try {
				localStorage.setItem(`${persistence.key}_nodes`, JSON.stringify(serialized));
				localStorage.setItem(`${persistence.key}_view`, JSON.stringify({ x, y, zoom }));
				localStorage.removeItem(persistence.key); // clean legacy key
			} catch (err) {
				Log_Warn(`Canvas -> Failed to save persistent storage: ${err}`);
			}
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

/**
 * Action to handle dragging individual nodes on the canvas.
 */
function dragNode(nodeEl: HTMLElement, initialNode: CanvasNodeData<CanvasRegistry>) {
	let node = initialNode;
	let startX = 0;
	let startY = 0;
	let initialNodeX = 0;
	let initialNodeY = 0;
	let isDraggingNode = false;

	function handlePointerDown(e: PointerEvent) {
		// Drag on left click or touch/pointer
		if (e.button !== 0 && e.pointerType === 'mouse') return;

		const target = e.target as HTMLElement;
		if (dragHandleClass) {
			if (!target.closest(`.${dragHandleClass}`)) return;
		} else {
			if (isInteractive(target)) return;
		}

		if (node.isPinned) return;

		e.stopPropagation();
		isDraggingNode = true;
		startX = e.clientX;
		startY = e.clientY;
		initialNodeX = node.x;
		initialNodeY = node.y;

		nodeEl.setPointerCapture(e.pointerId);
		nodeEl.addEventListener('pointermove', handlePointerMove);
		nodeEl.addEventListener('pointerup', handlePointerUp);
		nodeEl.addEventListener('pointercancel', handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDraggingNode) return;
		e.stopPropagation();

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		// Offset change divided by zoom level makes movement match pointer exactly
		node.x = initialNodeX + dx / zoom;
		node.y = initialNodeY + dy / zoom;
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDraggingNode) return;
		isDraggingNode = false;

		try {
			nodeEl.releasePointerCapture(e.pointerId);
		} catch (err) {}

		nodeEl.removeEventListener('pointermove', handlePointerMove);
		nodeEl.removeEventListener('pointerup', handlePointerUp);
		nodeEl.removeEventListener('pointercancel', handlePointerUp);

		triggerChange();
	}

	nodeEl.addEventListener('pointerdown', handlePointerDown);

	const stopProp = (e: Event) => {
		const target = e.target as HTMLElement;
		if (dragHandleClass) {
			// Always stop propagation for the resize handle, even when dragHandleClass is set
			if (target.closest('.canvas-node-resize-handle')) {
				e.stopPropagation();
				return;
			}
			if (!target.closest(`.${dragHandleClass}`)) return;
		} else {
			if (isInteractive(target)) return;
		}
		e.stopPropagation();
	};

	nodeEl.addEventListener('mousedown', stopProp);
	nodeEl.addEventListener('touchstart', stopProp);

	return {
		update(newNode: CanvasNodeData<CanvasRegistry>) {
			// Refresh the node reference when the nodes array is replaced
			// (e.g. deserialization in onMount with same IDs reuses DOM elements)
			node = newNode;
		},
		destroy() {
			nodeEl.removeEventListener('pointerdown', handlePointerDown);
			nodeEl.removeEventListener('mousedown', stopProp);
			nodeEl.removeEventListener('touchstart', stopProp);
		},
	};
}

/**
 * Action to handle resizing individual nodes on the canvas.
 */
function resizeNode(handleEl: HTMLElement, initialNode: CanvasNodeData<CanvasRegistry>) {
	let node = initialNode;
	let startX = 0;
	let startY = 0;
	let startWidth = 0;
	let startHeight = 0;
	let minWidth = 0;
	let minHeight = 0;
	let maxWidth = Number.MAX_VALUE;
	let maxHeight = Number.MAX_VALUE;
	let isResizing = false;

	function handlePointerDown(e: PointerEvent) {
		if (e.button !== 0 && e.pointerType === 'mouse') return;
		e.stopPropagation(); // prevent panning & dragging the node

		isResizing = true;
		startX = e.clientX;
		startY = e.clientY;

		const parent = handleEl.parentElement;
		if (parent) {
			startWidth = node.width ?? parent.offsetWidth;
			startHeight = node.height ?? parent.offsetHeight;

			const targetEl = parent.firstElementChild as HTMLElement;
			if (targetEl) {
				const computed = window.getComputedStyle(targetEl);
				minWidth = parseFloat(computed.minWidth) || 0;
				minHeight = parseFloat(computed.minHeight) || 0;

				const parsedMaxW = parseFloat(computed.maxWidth);
				maxWidth = Number.isNaN(parsedMaxW) ? Number.MAX_VALUE : parsedMaxW;

				const parsedMaxH = parseFloat(computed.maxHeight);
				maxHeight = Number.isNaN(parsedMaxH) ? Number.MAX_VALUE : parsedMaxH;
			} else {
				minWidth = 0;
				minHeight = 0;
				maxWidth = Number.MAX_VALUE;
				maxHeight = Number.MAX_VALUE;
			}
		} else {
			Log_Warn("ResizeNode -> For some reason couldn't find the parent... check me pls");
		}
		handleEl.setPointerCapture(e.pointerId);
		handleEl.addEventListener('pointermove', handlePointerMove);
		handleEl.addEventListener('pointerup', handlePointerUp);
		handleEl.addEventListener('pointercancel', handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isResizing) return;
		e.stopPropagation();

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		// Scale resize changes by the zoom factor
		let newWidth = startWidth + dx / zoom;
		let newHeight = startHeight + dy / zoom;

		// Clamp based on computed styles of the child widget (e.g. min-width / min-height)
		newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
		newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

		node.width = newWidth;
		node.height = newHeight;
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isResizing) return;
		isResizing = false;

		try {
			handleEl.releasePointerCapture(e.pointerId);
		} catch (err) {}

		handleEl.removeEventListener('pointermove', handlePointerMove);
		handleEl.removeEventListener('pointerup', handlePointerUp);
		handleEl.removeEventListener('pointercancel', handlePointerUp);

		triggerChange();
	}

	handleEl.addEventListener('pointerdown', handlePointerDown);

	// Explicitly block mousedown & touchstart propagation to prevent panning & dragging node
	const block = (e: Event) => e.stopPropagation();
	handleEl.addEventListener('mousedown', block);
	handleEl.addEventListener('touchstart', block);

	return {
		update(newNode: CanvasNodeData<CanvasRegistry>) {
			// Refresh the node reference when the nodes array is replaced
			// (e.g. deserialization in onMount with same IDs reuses DOM elements)
			node = newNode;
		},
		destroy() {
			handleEl.removeEventListener('pointerdown', handlePointerDown);
			handleEl.removeEventListener('mousedown', block);
			handleEl.removeEventListener('touchstart', block);
		},
	};
}

/**
 * Action using ResizeObserver to measure and bind node dimensions.
 * Skips the first observation callback if the node already has saved
 * dimensions (i.e. was deserialized), so we don't overwrite persisted
 * width/height before the wrapper's explicit style has been applied.
 */
function observeSize(nodeEl: HTMLElement, initialNode: CanvasNodeData<CanvasRegistry>) {
	let node = initialNode;
	const targetEl = (nodeEl.firstElementChild as HTMLElement) || nodeEl;

	// If the node already has saved dimensions, skip the very first
	// ResizeObserver callback to avoid clobbering them with raw DOM
	// measurements taken before the wrapper style has been applied.
	let skipFirst = node.width !== undefined && node.height !== undefined;

	const observer = new ResizeObserver((entries) => {
		if (skipFirst) {
			skipFirst = false;
			return;
		}
		for (const entry of entries) {
			const width = entry.borderBoxSize?.[0]?.inlineSize ?? targetEl.offsetWidth;
			const height = entry.borderBoxSize?.[0]?.blockSize ?? targetEl.offsetHeight;

			if (node.width !== width || node.height !== height) {
				node.width = width;
				node.height = height;
				triggerChange();
			}
		}
	});

	observer.observe(targetEl);
	return {
		update(newNode: CanvasNodeData<CanvasRegistry>) {
			// Refresh the node reference when the nodes array is replaced
			// (e.g. deserialization in onMount with same IDs reuses DOM elements)
			node = newNode;
			// Reset skipFirst — the new node may or may not have saved dimensions
			skipFirst = newNode.width !== undefined && newNode.height !== undefined;
		},
		destroy() {
			observer.disconnect();
		},
	};
}
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

    <!-- Render Dynamic Serializable Nodes (supporting component OR registry mappings) -->
    {#each nodes as node (node.id)}
      {@const Component = node.component || registry[node.type || ""]}
      {#if Component}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="canvas-node-wrapper"
          class:pinned={node.isPinned}
          style="left: {node.x}px; top: {node.y}px; width: {node.width
            ? node.width + 'px'
            : 'auto'}; height: {node.height ? node.height + 'px' : 'auto'};"
          use:dragNode={node}
          use:observeSize={node}
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
            <div class="canvas-node-resize-handle" use:resizeNode={node}></div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  {#if showControls && mode !== 'zen'}
    <div class="canvas-controls {classNames.controls ?? ''}">
      <div class="zoom-value {classNames.zoomValue ?? ''}">
        {Math.round(zoom * 100)}%
      </div>
      <div class="divider"></div>
      <button
        onclick={zoomIn}
        class={classNames.controlButton ?? ""}
        title="Zoom In"
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
          ><line x1="12" y1="5" x2="12" y2="19"></line><line
            x1="5"
            y1="12"
            x2="19"
            y2="12"
          ></line></svg
        >
      </button>
      <button
        onclick={zoomOut}
        class={classNames.controlButton ?? ""}
        title="Zoom Out"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="icon"><line x1="5" y1="12" x2="19" y2="12"></line></svg
        >
      </button>
      <button
        onclick={resetView}
        class={classNames.controlButton ?? ""}
        title="Reset View"
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
          ><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"
          ></circle></svg
        >
      </button>
    </div>
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

  /* Controls Overlay */
  .canvas-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(30, 30, 30, 0.75);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 6px 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
    z-index: 100;
    color: #e0e0e0;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
    font-size: 13px;
    font-weight: 500;
  }

  .zoom-value {
    min-width: 42px;
    text-align: center;
    user-select: none;
  }

  .divider {
    width: 1px;
    height: 16px;
    background: rgba(255, 255, 255, 0.15);
  }

  .canvas-controls button {
    background: transparent;
    border: none;
    color: #b0b0b0;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .canvas-controls button:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  .canvas-controls button:active {
    background: rgba(255, 255, 255, 0.12);
  }

  .icon {
    width: 15px;
    height: 15px;
  }
</style>
