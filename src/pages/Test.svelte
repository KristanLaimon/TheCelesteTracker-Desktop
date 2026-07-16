<script lang="ts">
// import { onMount } from 'svelte';
import CenteredLayout from '../layouts/CenteredLayout.svelte';
import { Log_Info } from '../libs/Logger';
// import { SQLiteExtension } from '../libs/CSqliteExtension';
import Canvas from '../libs/Wanvas/Canvas.svelte';
import type { CanvasNodeData, CanvasRegistry } from '../libs/Wanvas/Canvas.types';
import TextWidget from '../libs/Wanvas/widgets/TextWidget.svelte';

const registry = {
	textWidget: TextWidget,
} satisfies CanvasRegistry;

let defaultNodes = $state<CanvasNodeData<typeof registry>[]>([
	{
		id: '1',
		type: 'textWidget',
		x: 100,
		y: 150,
		props: {
			text: 'Hello Celeste Modder!',
		},
	},
]);

function AddNewTextWidget(text: string = '') {
	defaultNodes.push({
		id: defaultNodes.length.toString(),
		x: 100,
		y: 150,
		height: 150,
		width: 150,
		type: 'textWidget',
		props: {
			text: text,
		},
	} satisfies CanvasNodeData<typeof registry>);
}

let canvasX = $state(0);
let canvasY = $state(0);
let canvasZoom = $state(1);

function clearNodes() {
	defaultNodes = [];
}

function clearView() {
	canvasX = 0;
	canvasY = 0;
	canvasZoom = 1;
}

function clearAll() {
	defaultNodes = [];
	canvasX = 0;
	canvasY = 0;
	canvasZoom = 1;
}
</script>

<CenteredLayout>
  <div class="hud">
    <button class="hud-btn danger" onclick={clearNodes}>Clear Nodes</button>
    <button class="hud-btn" onclick={clearView}>Reset View</button>
    <button class="hud-btn danger" onclick={clearAll}>Clear All</button>
    <button class="hud-btn" onclick={() => {AddNewTextWidget("default text!!")}}>Add new txt widget</button>
  </div>

  <Canvas {registry}
    classNames={{wrapper: "w-[80vw] h-[80vh]"}}
    mode="normal"
    bind:nodes={defaultNodes}
    bind:x={canvasX}
    bind:y={canvasY}
    bind:zoom={canvasZoom}
    persistence={{
      key: 'test-canvas-persistence',
      beforeSave: (nodes, _cancel) => {
        Log_Info('Canvas is about to save nodes:', nodes);
      },
      afterSave: (nodes) => {
       Log_Info('Canvas saved successfully:', nodes);
      },
    }}
    showDots={true}
  />
</CenteredLayout>

<style>
  /* HUD overlay styling */
  .hud {
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    gap: 8px;
    z-index: 150;
    pointer-events: auto;
  }

  .hud-btn {
    background: rgba(30, 30, 32, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .hud-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .hud-btn.danger {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
  }

  .hud-btn.danger:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.4);
  }
</style>
