<script lang="ts">
import { onMount } from 'svelte';
import ChapterCard from '../components/ChapterCard.svelte';
import TaskNode from '../components/TaskNode.svelte';
import Canvas from '../libs/Wanvas/Canvas.svelte';
import type { CanvasNodeData } from '../libs/Wanvas/Canvas.types';

// Map type strings to Svelte Components
const registry = {
	chapterNode: ChapterCard,
	taskNode: TaskNode,
};

// State: zoom and pan coordinates (with persistence)
let x = $state(0);
let y = $state(0);
let zoom = $state(1);

// Dynamic nodes list state demonstrating serializable registry type AND direct Svelte component class injection
let nodes = $state<CanvasNodeData<typeof registry>[]>([
	{
		id: 'chap-1',
		type: 'chapterNode',
		x: 100,
		y: 150,
		isPinned: true,
		props: {
			number: '01',
			title: 'Forsaken City',
			status: 'completed',
			berries: '20 / 20',
			cassette: 'Found',
			heart: 'Blue',
		},
	},
	{
		id: 'todo-list',
		type: 'taskNode',
		x: 500,
		y: 150,
		width: 250,
		height: 250,
		props: {
			title: 'Modding Checklist',
		},
	},
	// Direct component class example (fully portable, non-serializable without mapping)
	{
		id: 'custom-node',
		component: ChapterCard,
		x: 900,
		y: 150,
		props: {
			number: '03',
			title: 'Celestial Resort',
			status: 'locked',
			berries: '0 / 29',
			cassette: 'Missing',
			heart: 'Missing',
		},
	},
]);

// Load state on mount
onMount(() => {
	const savedNodes = localStorage.getItem('celeste-tracker-nodes');
	if (savedNodes) {
		try {
			const parsed = JSON.parse(savedNodes);
			// Re-map the parsed JSON array back to Svelte components if they are direct
			nodes = parsed.map((n: CanvasNodeData<typeof registry>) => {
				if (n.id === 'custom-node') {
					(n as any).component = ChapterCard;
				}
				return n;
			});
		} catch (err) {
			console.error('Failed to parse saved nodes:', err);
		}
	}

	const savedPos = localStorage.getItem('celeste-tracker-view');
	if (savedPos) {
		try {
			const parsed = JSON.parse(savedPos);
			x = parsed.x;
			y = parsed.y;
			zoom = parsed.zoom;
		} catch (err) {
			console.error('Failed to parse saved view:', err);
		}
	}
});

// Save callback triggered when nodes change position or size
function handleNodeChange(updatedNodes: CanvasNodeData[]) {
	localStorage.setItem('celeste-tracker-nodes', JSON.stringify(updatedNodes));
}

// Effect to save viewport changes (debounced to avoid writing to localStorage every frame/tick)
$effect(() => {
	const currentView = { x, y, zoom };
	const timer = setTimeout(() => {
		localStorage.setItem('celeste-tracker-view', JSON.stringify(currentView));
	}, 250);

	return () => {
		clearTimeout(timer);
	};
});

// Helper to calculate world coordinates for new nodes at screen center
function getCenterWorldCoords() {
	const rect = document.querySelector('.root')?.getBoundingClientRect();
	const width = rect?.width ?? 800;
	const height = rect?.height ?? 600;
	return {
		x: (width / 2 - x) / zoom - 125,
		y: (height / 2 - y) / zoom - 110,
	};
}

// Add a new Chapter Card node
function addChapterNode() {
	const id = `chap-${Date.now()}`;
	const coords = getCenterWorldCoords();

	nodes.push({
		id,
		type: 'chapterNode',
		x: coords.x,
		y: coords.y,
		props: {
			number: 'New',
			title: `Custom Chapter ${nodes.length + 1}`,
			status: 'locked',
			berries: '0 / 0',
			cassette: 'Missing',
			heart: 'Missing',
		},
	});

	handleNodeChange(nodes);
}

// Add a new Task Node list
function addTaskNode() {
	const id = `todo-${Date.now()}`;
	const coords = getCenterWorldCoords();

	nodes.push({
		id,
		type: 'taskNode',
		x: coords.x,
		y: coords.y,
		width: 250,
		height: 250,
		props: {
			title: 'Mod Tasks list',
		},
	});

	handleNodeChange(nodes);
}

// Clear/Reset all storage
function clearPersistence() {
	localStorage.removeItem('celeste-tracker-nodes');
	localStorage.removeItem('celeste-tracker-view');
	window.location.reload();
}
</script>

<main class="root">
  <!-- Interactive HUD overlay -->
  <div class="hud">
    <button class="hud-btn" onclick={addChapterNode}>+ Add Chapter</button>
    <button class="hud-btn" onclick={addTaskNode}>+ Add Tasklist</button>
    <button class="hud-btn danger" onclick={clearPersistence}>Clear Save</button>
  </div>

  <Canvas
    bind:x
    bind:y
    bind:zoom
    bind:nodes
    {registry}
    dragHandleClass="drag-handle"
    onNodeChange={handleNodeChange}
  >
    <!-- Dynamic SVG connection overlay that draws lines between nodes in real-time -->
    <svg class="connections-overlay">
      {#if nodes.length >= 2}
        {#each Array(nodes.length - 1) as _, i}
          {@const from = nodes[i]}
          {@const to = nodes[i + 1]}
          <!-- Line linking centers of cards -->
          <line
            x1={from.x + (from.width ? from.width / 2 : 125)}
            y1={from.y + (from.height ? from.height / 2 : 110)}
            x2={to.x + (to.width ? to.width / 2 : 125)}
            y2={to.y + (to.height ? to.height / 2 : 110)}
            stroke="rgba(147, 51, 234, 0.4)"
            stroke-width="2"
            stroke-dasharray="6,6"
          />
        {/each}
      {/if}
    </svg>
  </Canvas>
</main>

<style>
  .root {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #121212;
    overflow: hidden;
    position: relative;
  }

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

  /* SVG Connections Line Styling */
  .connections-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    overflow: visible;
    pointer-events: none;
    z-index: -1;
  }
</style>
