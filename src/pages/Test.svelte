<script lang="ts">
// import { onMount } from 'svelte';
import CenteredLayout from '../layouts/CenteredLayout.svelte';
// import { SQLiteExtension } from '../libs/CSqliteExtension';
import Canvas from '../libs/Wanvas/Canvas.svelte';
import type { CanvasNodeData, CanvasPersistence, CanvasRegistry } from '../libs/Wanvas/Canvas.types';
import TextWidget from '../libs/Wanvas/widgets/TextWidget.svelte';

const registry = {
	textWidget: TextWidget,
} satisfies CanvasRegistry;

// Initialize nodes with default starting items (overwritten if localStorage has data)
let nodes = $state<CanvasNodeData<typeof registry>[]>([
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
	nodes.push({
		id: nodes.length.toString(),
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

// Bindable view state — set directly to reset the viewport
let canvasX = $state(0);
let canvasY = $state(0);
let canvasZoom = $state(1);

// Setup the persistence configuration object
let persistence = $state<CanvasPersistence<typeof registry>>({
	key: 'test-canvas-persistence',
	beforeSave: (nodes, _cancel) => {
		console.log('Canvas is about to save nodes:', nodes);
	},
	afterSave: (nodes) => {
		console.log('Canvas saved successfully:', nodes);
	},
});

function clearNodes() {
	nodes = [];
}

function clearView() {
	canvasX = 0;
	canvasY = 0;
	canvasZoom = 1;
}

function clearAll() {
	nodes = [];
	canvasX = 0;
	canvasY = 0;
	canvasZoom = 1;
}

// onMount(async () => {
// 	console.log('about to execute! DB');
// 	// try {
// 		// const db = new SQLiteExtension('TheCelesteTrackerTestDb.db');
// 		// const res = await db.execute('SELECT * from Campaigns LIMIT 5;');
// 		// console.log('executed DB successfully:', res);
// 		// AddNewTextWidget(JSON.stringify(res, null, 2));
// 	// } catch (error: any) {
// 		// console.error('❌ DB execution failed:', error);
// 		// AddNewTextWidget(`DB Error: ${error.message}`);
// 	// }
// });
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
    bind:nodes
    bind:x={canvasX}
    bind:y={canvasY}
    bind:zoom={canvasZoom}
    bind:persistence
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
