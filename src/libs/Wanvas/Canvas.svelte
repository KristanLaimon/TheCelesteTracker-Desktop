<script lang="ts">
/**
 * @module Canvas
 * @description Wrapper component around CanvasWhiteboard that adds the zoom overlay UI controls.
 * @author Kristan
 * @license MIT
 */

import type { CanvasPersistence, CanvasProps } from './Canvas.types';
import { calculateZoomOffset, clampZoom } from './CanvasMath';
import CanvasWhiteboard from './CanvasWhiteboard.svelte';

export type { CanvasNodeData, CanvasPersistence, CanvasProps } from './Canvas.types';

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
	persistence = $bindable({ key: 'canvas-persistence-default' } as CanvasPersistence | null),
}: CanvasProps = $props();

let canvasWrapperEl = $state<HTMLDivElement | null>(null);

function zoomIn() {
	zoomAtCenter(1.25);
}

// ponytail: simplified zoomOut wrapper
function zoomOut() {
	zoomAtCenter(1 / 1.25);
}

function zoomAtCenter(multiplier: number) {
	if (!canvasWrapperEl) return;
	const rect = canvasWrapperEl.getBoundingClientRect();
	const cx = rect.width / 2;
	const cy = rect.height / 2;

	const oldZoom = zoom;
	const limits = {
		minZoom,
		maxZoom,
		zoomSpeed,
		infinite,
		limitXMin,
		limitXMax,
		limitYMin,
		limitYMax,
	};
	const newZoom = clampZoom(zoom * multiplier, limits);

	if (newZoom === oldZoom) return;

	const newPos = calculateZoomOffset({ x: cx, y: cy }, { x, y }, newZoom / oldZoom, limits);
	zoom = newZoom;
	x = newPos.x;
	y = newPos.y;
}
</script>

{#snippet controlsSnippet()}
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
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
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
          class="icon"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  {/if}
{/snippet}

<CanvasWhiteboard
  bind:x
  bind:y
  bind:zoom
  {minZoom}
  {maxZoom}
  {zoomSpeed}
  {infinite}
  {limitXMin}
  {limitXMax}
  {limitYMin}
  {limitYMax}
  {resizable}
  bind:nodes
  {dragHandleClass}
  {onNodeChange}
  {classNames}
  class={className}
  {style}
  {bgColor}
  {dotColor}
  {dotSize}
  {showDots}
  {mode}
  bind:persistence
  bind:wrapperEl={canvasWrapperEl}
  controls={controlsSnippet}
>
  {#if children}
    {@render children()}
  {/if}
</CanvasWhiteboard>

<style>
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
    cursor: pointer;
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
