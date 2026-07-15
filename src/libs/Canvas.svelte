<script lang="ts">
/**
 * @module Canvas
 * @description A fully encapsulated, portable, zoomable, and pannable 2D canvas workspace for Svelte 5.
 * @author Kristan
 * @license MIT
 */

import type { Component, Snippet } from 'svelte';
import { onMount } from 'svelte';
import { Log_Warn } from "../logic/logger";

// biome-ignore lint/suspicious/noExplicitAny: Needed to create this type
type AnySvelteComponent = Component<any,any,any>;

/**
 * Tailwind CSS class names for styling specific parts of the Canvas component.
 */
export interface CanvasClassNames {
  /** Custom CSS classes for the outer wrapper container. */
  wrapper?: string;
  /** Custom CSS classes for the inner transformed content container. */
  content?: string;
  /** Custom CSS classes for the floating controls bar. */
  controls?: string;
  /** Custom CSS classes for the control buttons (Zoom In, Zoom Out, Reset). */
  controlButton?: string;
  /** Custom CSS classes for the zoom level percentage readout. */
  zoomValue?: string;
}

/**
 * Represents a single node configuration in the canvas.
 * This structure can be JSON-serializable if using `type` + `registry`,
 * or can render custom Svelte components directly using the `component` property.
 */
export interface CanvasNodeData {
  /** Unique identifier for the node. */
  id: string;
  /** The registered type of Svelte component to render for this node. */
  type?: string;
  /** Direct Svelte component class to render for this node (non-serializable). */
  component?: AnySvelteComponent;
  /** Horizontal position of the node in the canvas world space. */
  x: number;
  /** Vertical position of the node in the canvas world space. */
  y: number;
  /** Measured width of the node (automatically populated/updated). */
  width?: number;
  /** Measured height of the node (automatically populated/updated). */
  height?: number;
  /** Optional custom serializable props passed to the Svelte component. */
  props?: Record<string, unknown>;
}

/**
 * Props definition for the Canvas library component.
 */
interface Props {
  /**
   * The horizontal pan translation in pixels.
   * Supports Svelte 5 two-way binding.
   * @default 0
   */
  x?: number;
  /**
   * The vertical pan translation in pixels.
   * Supports Svelte 5 two-way binding.
   * @default 0
   */
  y?: number;
  /**
   * The current zoom scale factor (e.g. 1.0 = 100%).
   * Supports Svelte 5 two-way binding.
   * @default 1.0
   */
  zoom?: number;
  /**
   * The minimum zoom scale level.
   * @default 0.15
   */
  minZoom?: number;
  /**
   * The maximum zoom scale level.
   * @default 8.0
   */
  maxZoom?: number;
  /**
   * The zoom change sensitivity when scrolling the mouse wheel.
   * @default 0.0015
   */
  zoomSpeed?: number;
  /**
   * Whether panning is infinite. If false, panning clamps to boundaries.
   * @default true
   */
  infinite?: boolean;
  /**
   * The minimum allowed horizontal coordinate when infinite is false.
   * @default -5000
   */
  limitXMin?: number;
  /**
   * The maximum allowed horizontal coordinate when infinite is false.
   * @default 5000
   */
  limitXMax?: number;
  /**
   * The minimum allowed vertical coordinate when infinite is false.
   * @default -5000
   */
  limitYMin?: number;
  /**
   * The maximum allowed vertical coordinate when infinite is false.
   * @default 5000
   */
  limitYMax?: number;
  /**
   * Whether double clicking on the canvas resets the pan and zoom values to default.
   * @default true
   */
  doubleClickToReset?: boolean;
  /**
   * Whether to show the floating zoom/pan controls overlay.
   * @default true
   */
  showControls?: boolean;
  /**
   * Whether nodes are resizable via a drag handle in the bottom-right corner.
   * @default true
   */
  resizable?: boolean;
  /**
   * A bindable array of dynamic node configurations.
   * Supports runtime additions, deletions, and modifications.
   * @default []
   */
  nodes?: CanvasNodeData[];
  /**
   * A registry mapping type strings to Svelte Component classes.
   * @default {}
   */
  registry?: Record<string, AnySvelteComponent>;
  /**
   * Optional class name target for dragging nodes (e.g. "drag-handle").
   * If specified, clicking outside the handle will not drag the node.
   * @default ""
   */
  dragHandleClass?: string;
  /**
   * Optional callback function triggered when any node's position or size changes.
   * Receives a clean, JSON-serializable copy of all nodes.
   */
  onNodeChange?: (nodes: CanvasNodeData[]) => void;
  /**
   * Custom Tailwind CSS classes to override styling of individual canvas internal parts.
   */
  classNames?: CanvasClassNames;
  /**
   * A CSS class name applied directly to the outer canvas wrapper element.
   */
  class?: string;
  /**
   * Static child Svelte components or HTML elements to render inside the transformed canvas container.
   */
  children?: Snippet;
}

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
  doubleClickToReset = true,
  showControls = true,
  resizable = true,
  nodes = $bindable([]),
  registry = {},
  dragHandleClass = '',
  onNodeChange,
  classNames = {},
  class: className = '',
  children,
}: Props = $props();

// Internal references
let wrapperEl = $state<HTMLDivElement | null>(null);
let isPanning = $state(false);

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
  if (wrapperEl && x === 0 && y === 0) {
    const rect = wrapperEl.getBoundingClientRect();
    x = rect.width / 2;
    y = rect.height / 2;
  }
});

// Helper to detect interactive elements so we don't accidentally pan
function isInteractive(target: HTMLElement | null): boolean {
  if (!target) return false;
  let current: HTMLElement | null = target;
  while (current && current !== wrapperEl) {
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
function handleDoubleClick(e: MouseEvent) {
  if (!doubleClickToReset) return;
  if (isInteractive(e.target as HTMLElement)) return;
  resetView();
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

let changeTimeout: number | undefined;

/**
 * Dispatches the changes callback, debounced to prevent spamming
 * multiple layout updates in the same tick.
 */
function triggerChange() {
  if (onNodeChange) {
    if (changeTimeout) cancelAnimationFrame(changeTimeout);
    changeTimeout = requestAnimationFrame(() => {
      const serialized = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
        props: n.props ? JSON.parse(JSON.stringify(n.props)) : {},
      }));
      onNodeChange(serialized);
    });
  }
}

/**
 * Action to handle dragging individual nodes on the canvas.
 */
function dragNode(nodeEl: HTMLElement, node: CanvasNodeData) {
  let startX = 0;
  let startY = 0;
  let initialNodeX = 0;
  let initialNodeY = 0;
  let isDraggingNode = false;

  function handlePointerDown(e: PointerEvent) {
    // Drag on left click or touch/pointer
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Handle dragHandleClass filtering
    if (dragHandleClass) {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${dragHandleClass}`)) return;
    } else {
      // Prevent drag on standard interactive controls
      if (isInteractive(e.target as HTMLElement)) return;
    }

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

    triggerChange();
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

  // Stop propagation of mousedown and touchstart on the entire node wrapper
  // to prevent canvas panning when clicking or dragging the node elements.
  const stopProp = (e: Event) => {
    if (dragHandleClass) {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${dragHandleClass}`)) return;
    } else {
      if (isInteractive(e.target as HTMLElement)) return;
    }
    e.stopPropagation();
  };

  nodeEl.addEventListener('mousedown', stopProp);
  nodeEl.addEventListener('touchstart', stopProp);

  return {
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
function resizeNode(handleEl: HTMLElement, node: CanvasNodeData) {
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let isResizing = false;

  function handlePointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation(); // prevent panning & dragging the node

    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;

    const parent = handleEl.parentElement;
    if (parent){
      startWidth = node.width ?? parent.offsetWidth;
      startHeight = node.height ?? parent.offsetHeight;
    }else {
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
    node.width = Math.max(80, startWidth + dx / zoom);
    node.height = Math.max(50, startHeight + dy / zoom);

    triggerChange();
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
    destroy() {
      handleEl.removeEventListener('pointerdown', handlePointerDown);
      handleEl.removeEventListener('mousedown', block);
      handleEl.removeEventListener('touchstart', block);
    },
  };
}

/**
 * Action using ResizeObserver to measure and bind node dimensions.
 */
function observeSize(nodeEl: HTMLElement, node: CanvasNodeData) {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = entry.borderBoxSize?.[0]?.inlineSize ?? nodeEl.offsetWidth;
      const height = entry.borderBoxSize?.[0]?.blockSize ?? nodeEl.offsetHeight;

      if (node.width !== width || node.height !== height) {
        node.width = width;
        node.height = height;
        triggerChange();
      }
    }
  });

  observer.observe(nodeEl);
  return {
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
  class="canvas-wrapper {classNames.wrapper ?? ''} {className}"
  class:panning={isPanning}
  onmousedown={handleMouseDown}
  oncontextmenu={handleContextMenu}
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
  ondblclick={handleDoubleClick}
  style="background-size: {50 * zoom}px {50 *
    zoom}px; background-position: {x}px {y}px;"
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
          style="left: {node.x}px; top: {node.y}px; width: {node.width
            ? node.width + 'px'
            : 'auto'}; height: {node.height ? node.height + 'px' : 'auto'};"
          use:dragNode={node}
          use:observeSize={node}
        >
          <Component {...node.props || {}} />

          <!-- nwse-resize handle rendered if resizable is true -->
          {#if resizable}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="canvas-node-resize-handle" use:resizeNode={node}></div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  {#if showControls}
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
  .canvas-wrapper {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;

    background-color: #242424;
    background-image: radial-gradient(
      circle,
      rgb(58, 58, 58) 1.5px,
      transparent 1.5px
    );
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
    transition: border-color 0.15s;
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
