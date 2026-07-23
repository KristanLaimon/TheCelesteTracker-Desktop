# Wanvas.svelte Documentation (Widget Canvas)

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
| **`persistence`** | `CanvasPersistence \| null` | `{ key: 'canvas-persistence-default' }` | Persistence configuration and callbacks for localStorage (bindable). Bypassed if `onNodeChange` is passed. Set to `null` to explicitly disable storage. |
| **`classNames`** | `CanvasClassNames` | `{}` | Tailored Tailwind CSS override classes for internal canvas elements. |
| **`class`** | `string` | `""` | CSS class applied directly to the outer canvas wrapper element. |
| **`style`** | `string` | `""` | Custom inline style rules applied directly to the outer canvas wrapper element. |
| **`bgColor`** | `string` | `"#242424"` | The background color of the canvas workspace. |
| **`dotColor`** | `string` | `"rgb(58, 58, 58)"` | The color of the background grid dots. |
| **`dotSize`** | `number` | `1.5` | The radius of the background grid dots in pixels. |
| **`showDots`** | `boolean` | `true` | Whether to show the background dot grid pattern. |
| **`mode`** | `'normal' \| 'zen'` | `"normal"` | Display mode: `'normal'` shows HUD controls, while `'zen'` hides them. |
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
Map your Svelte components inside a registry object. The nodes array then remains fully JSON-serializable, storing only component identifiers (`type`) and configuration parameter values (`props`). Note that the `id` property of each node is optional; if omitted, `Canvas` will automatically generate a unique UUID for it.

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

### 4. The `no-interactive` Class (Focus Lock & Canvas Controls Override)
If you want to place a normally interactive element (like an `<input>`, `<textarea>`, or `<button>`) inside a node but prevent it from receiving user focus, key input, or native clicks, give it the class `no-interactive`.
The canvas will intercept clicks on these elements:
- It calls `e.preventDefault()` to block browser focus or button clicks (locking it in read-only / preview mode).
- It calls `e.stopPropagation()` and treats interaction as standard node dragging or canvas panning.

```svelte
<!-- This textarea cannot be typed in or focused; clicking and dragging it drags the node wrapper instead -->
<textarea class="no-interactive" value="Read-only text area serving as a drag handle" />
```

---

## Persistence & Widget Properties Synchronization

`Canvas.svelte` supports an automated, persistence-first architecture. This allows widgets inside the canvas to notify the parent of property updates reactively while keeping the loaded/saved data 100% JSON-serializable (without storing callback functions in `localStorage`).

### 1. The `ICanvasWidgetProps` Interface
For a child component to reactively update its properties, its props should extend `ICanvasWidgetProps<T>` from `./Canvas.types`. The canvas automatically intercepts and injects the `onChange` callback at runtime.

```svelte
<!-- TextWidget.svelte -->
<script lang="ts">
  import type { ICanvasWidgetProps } from "../libs/Canvas.types";

  type TextProps = {
    text: string;
  };

  // Combine component properties with the ICanvasWidgetProps contract
  type Props = TextProps & ICanvasWidgetProps<TextProps>;

  let { text, onChange }: Props = $props();
</script>

<article class="widget">
  <textarea
    value={text}
    oninput={(e) => onChange?.({ text: e.currentTarget.value })}
  ></textarea>
</article>
```

### 2. Auto-Persistence and Configuration (`CanvasPersistence`)
By default, the canvas will automatically save and load its layout to/from `localStorage` using the default key `'canvas-persistence-default'`.

To use custom keys, intercept saving, or clear the canvas programmatically, pass a `persistence` object:

```svelte
<script lang="ts">
  import Canvas from "./libs/Canvas.svelte";
  import type { CanvasPersistence } from "./libs/Canvas.types";
  import type { CanvasNodeData } from "./libs/Canvas.types";

  let nodes = $state<CanvasNodeData[]>([]);

  // Setup the persistence config
  let persistence = $state<CanvasPersistence>({
    key: "my-custom-board",
    
    // Fired before saving. Invoke cancel() to abort saving
    beforeSave: (nodes, cancel) => {
      console.log("Saving nodes...", nodes);
    },
    
    // Fired after successful save to localStorage
    afterSave: (nodes) => {
      console.log("Saved successfully!");
    }
  });
</script>

<!-- Clear the canvas or reset the viewport programmatically using the bound methods -->
<button onclick={() => persistence.clear?.()}>
  Clear Canvas
</button>
<button onclick={() => persistence.resetView?.()}>
  Reset Viewport
</button>

<Canvas bind:nodes bind:persistence />
```
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
