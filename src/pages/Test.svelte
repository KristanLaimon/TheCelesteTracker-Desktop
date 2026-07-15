<script lang="ts">
import TextWidget from '../components/Widgets/canvas_widgets/TextWidget.svelte';
import CenteredLayout from '../layouts/CenteredLayout.svelte';
import Canvas from '../libs/Canvas.svelte';
import type { CanvasNodeData, CanvasPersistence, CanvasRegistry } from '../libs/Canvas.types';

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

// Setup the persistence configuration object
let persistence = $state<CanvasPersistence<typeof registry>>({
	key: 'test-canvas-persistence',
	beforeSave: (nodes, _cancel) => {
		console.log('Canvas is about to save nodes:', nodes);
	},
	afterSave: (nodes) => {
		console.log('Canvas saved successfully:', nodes);
	}
});

function clearPersistence() {
	localStorage.removeItem('test-canvas-persistence_nodes');
	localStorage.removeItem('test-canvas-persistence_view');
	window.location.reload();
}
</script>

<CenteredLayout>
  <div class="hud">
    <button class="hud-btn danger" onclick={clearPersistence}>Clear Save</button>
  </div>

  <Canvas {registry} 
    classNames={{wrapper: "w-[80vw] h-[80vh]"}} 
    mode="normal" 
    bind:nodes 
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
