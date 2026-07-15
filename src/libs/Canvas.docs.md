# Canvas.svelte Documentation

`Canvas.svelte` is a fully encapsulated, portable, zoomable, and pannable 2D workspace component designed for Svelte 5. It supports infinite or bounded panning, mouse-wheel zooming relative to the cursor, pinch-to-zoom touch gestures, custom node dragging and resizing, and full state serialization for persistent layouts.

---

## Key Features

- **Cursor-Relative Zooming:** Mouse-wheel zoom targets the cursor position so the point under the mouse remains fixed.
- **Dynamic Resizable Nodes:** Drag elements to relocate them, and drag the bottom-right corner handles to resize them. Resizing and movement scale automatically with the zoom factor.
- **Double-Click Reset:** Double-clicking empty canvas space resets translation to the center and zoom to `1.0` (100%).
- **Interactive HUD Controls:** A floating glassmorphic panel displays zoom percentage and offers buttons for Zoom In, Zoom Out, and Reset.
- **Serializable Props Architecture:** Node positions, sizes, and props are clean, JSON-serializable configurations. Svelte hydrates these back into functional components at runtime using a registry mapping.
- **A11y & Pointer Captures:** Robust pointer captures prevent "stuck panning" when releasing drag clicks outside the window.

---

## API Reference

### Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`x`** | `number` | `0` | Horizontal viewport pan translation in pixels (bindable). |
| **`y`** | `number` | `0` | Vertical viewport pan translation in pixels (bindable). |
| **`zoom`** | `number` | `1.0` | Viewport zoom scale factor (bindable). |
| **`minZoom`** | `number` | `0.15` | Minimum allowed zoom level (e.g. 15%). |
| **`maxZoom`** | `number` | `8.0` | Maximum allowed zoom level (e.g. 800%). |
| **`zoomSpeed`** | `number` | `0.0015` | Sensitivity of the mouse wheel zooming. |
| **`infinite`** | `boolean` | `true` | When true, panning is infinite. Otherwise, clamps to bounds. |
| **`limitXMin`** | `number` | `-5000` | Minimum horizontal pan boundary (when `infinite` is false). |
| **`limitXMax`** | `number` | `5000` | Maximum horizontal pan boundary (when `infinite` is false). |
| **`limitYMin`** | `number` | `-5000` | Minimum vertical pan boundary (when `infinite` is false). |
| **`limitYMax`** | `number` | `5000` | Maximum vertical pan boundary (when `infinite` is false). |
| **`doubleClickToReset`** | `boolean` | `true` | Enables double-click on empty canvas to reset pan/zoom. |
| **`showControls`** | `boolean` | `true` | Toggles visibility of the floating HUD controls overlay. |
| **`resizable`** | `boolean` | `true` | Enables/disables resize handles on canvas nodes. |
| **`nodes`** | `CanvasNodeData[]` | `[]` | Bindable array of dynamic node configurations (bindable). |
| **`registry`** | `Record<string, any>` | `{}` | Key-value mapping of component type names to Svelte Component classes. |
| **`dragHandleClass`** | `string` | `""` | Optional CSS selector class (e.g. `"drag-handle"`). If specified, nodes can *only* be dragged via elements matching this class. |
| **`onNodeChange`** | `function` | `undefined` | Callback fired when a node is moved or resized. Receives a clean JSON-serializable array of all nodes. |
| **`classNames`** | `CanvasClassNames` | `{}` | Tailored Tailwind CSS override classes for internal canvas elements. |
| **`class`** | `string` | `""` | CSS class applied directly to the outer canvas wrapper element. |
| **`children`** | `Snippet` | `undefined` | Static children nodes / HTML snippet. |

---

## How to position child components

All nodes inside the canvas are rendered inside an absolute-positioned container. To place elements at specific coordinates on your board:
1. Ensure they are styled with `position: absolute;`.
2. Bind their coordinates using `left: {x}px; top: {y}px;`.
3. Give them a width and height if you want them to have specific sizes.

```svelte
<Canvas>
  <div style="position: absolute; left: 150px; top: 200px; width: 200px; height: 100px;">
    Static Canvas Item
  </div>
</Canvas>
```

---

## Rendering Svelte Components (Registry vs Direct)

`Canvas.svelte` gives you two ways to add functional components:

### Option A: Registry Pattern (Recommended for Serialization & Persistence)
Map your Svelte components inside a registry object. The nodes array then remains fully JSON-serializable, storing only component identifiers (`type`) and configuration parameter values (`props`).

```svelte
<script lang="ts">
  import Canvas from "./Canvas.svelte";
  import ChapterCard from "./ChapterCard.svelte";
  import TaskNode from "./TaskNode.svelte";

  const registry = {
    chapterCard: ChapterCard,
    taskList: TaskNode
  };

  let nodes = $state([
    {
      id: "node-1",
      type: "chapterCard",
      x: 100,
      y: 150,
      props: { title: "Forsaken City", complete: true }
    }
  ]);
</script>

<Canvas bind:nodes {registry} />
```

### Option B: Direct Injection (Non-Serializable)
For fast prototyping where serialization is not needed, you can pass Svelte component classes directly to the `component` property:

```svelte
<script lang="ts">
  import Canvas from "./Canvas.svelte";
  import CustomCard from "./CustomCard.svelte";

  let nodes = $state([
    {
      id: "node-2",
      component: CustomCard,
      x: 300,
      y: 200,
      props: { label: "Direct Component Injection" }
    }
  ]);
</script>

<Canvas bind:nodes />
```

---

## Designing Interactive Child Components

By default, clicking or dragging on empty canvas space pans the viewport. If your Svelte components contain inputs, buttons, sliders, or drag-handles, you must prevent clicks on those elements from starting canvas pans or drags.

There are three ways to make your Svelte components interactive:

### 1. Standard HTML Elements (Automatic)
The canvas automatically blocks panning when events originate from:
- `<button>`
- `<input>`
- `<textarea>`
- `<select>`
- `<a>`

### 2. The `interactive` or `no-pan` Class
Add the class `interactive` or `no-pan` to any custom HTML tag inside your Svelte component. The canvas walks up the DOM tree and ignores dragging if it hits these classes:
```svelte
<div class="custom-slider interactive" onpointerdown={handleSlide}>
  <!-- Slider remains fully draggable without dragging the canvas background -->
</div>
```

### 3. Capture Event Bubbling (Most Robust)
If you are importing third-party libraries or want to isolate a container completely, stop propagation of the click events. This prevents pointer event bubbling from ever reaching the canvas listener:
```svelte
<!-- Stop mousedown and touchstart from bubbling up to the canvas -->
<div 
  onmousedown={(e) => e.stopPropagation()} 
  ontouchstart={(e) => e.stopPropagation()}
  class="card-body"
>
  <!-- Interactive elements here work normally -->
</div>
```

---

## State Persistence Guide (LocalStorage Example)

This example binds both the **viewport translation/zoom** and **dynamic node layouts** to `localStorage`. The board will reload exactly where the user left off.

```svelte
<script lang="ts">
  import Canvas from "./Canvas.svelte";
  import type { CanvasNodeData } from "./Canvas.svelte";
  import ChapterCard from "./ChapterCard.svelte";
  import { onMount } from "svelte";

  const registry = {
    chapterNode: ChapterCard
  };

  // Viewport binds
  let x = $state(0);
  let y = $state(0);
  let zoom = $state(1);

  // Nodes list
  let nodes = $state<CanvasNodeData[]>([]);

  // Load layout on startup
  onMount(() => {
    const savedNodes = localStorage.getItem("canvas-nodes");
    if (savedNodes) {
      try {
        nodes = JSON.parse(savedNodes);
      } catch (err) {
        console.error(err);
      }
    }

    const savedView = localStorage.getItem("canvas-view");
    if (savedView) {
      try {
        const parsed = JSON.parse(savedView);
        x = parsed.x;
        y = parsed.y;
        zoom = parsed.zoom;
      } catch (err) {
        console.error(err);
      }
    }
  });

  // Save nodes when dragged or resized
  function handleNodeChange(updatedNodes: CanvasNodeData[]) {
    localStorage.setItem("canvas-nodes", JSON.stringify(updatedNodes));
  }

  // Save viewport changes reactively
  $effect(() => {
    localStorage.setItem("canvas-view", JSON.stringify({ x, y, zoom }));
  });
</script>

<main class="root">
  <Canvas
    bind:x
    bind:y
    bind:zoom
    bind:nodes
    {registry}
    dragHandleClass="drag-handle"
    onNodeChange={handleNodeChange}
  />
</main>
```

---

## Styling with TailwindCSS

The canvas includes default, dark-themed styling, but is built to be customized using Tailwind CSS utility classes via the `classNames` property:

```svelte
<Canvas
  classNames={{
    // Styles the outer canvas window container
    wrapper: "rounded-2xl border border-zinc-800 shadow-2xl shadow-black",
    
    // Styles the inner canvas content area
    content: "transition-all duration-75",
    
    // Styles the floating control bar overlay
    controls: "bg-zinc-950/80 border border-zinc-800 text-zinc-300 rounded-full py-2 px-4 shadow-lg",
    
    // Styles HUD zoom buttons
    controlButton: "hover:bg-zinc-800 hover:text-white rounded-full transition-colors",
    
    // Styles the zoom value text
    zoomValue: "font-mono font-bold text-xs tracking-tight"
  }}
/>
```
