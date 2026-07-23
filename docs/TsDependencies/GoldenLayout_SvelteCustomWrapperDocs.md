# GoldenLayout.svelte Documentation

`GoldenLayout.svelte` is a Svelte 5 wrapper component for the powerful **Golden Layout** multi-window layout manager. It allows you to build IDE-like dashboards with splitters, columns, rows, drag-and-drop tab reordering, and dynamic tab adding/removal.

---

## Key Features

- **Responsive Grid Resizing:** Uses a `ResizeObserver` to automatically resize internal panels when the parent container sizes change (e.g. window resize or sidebar collapse).
- **Self-Healing "+" Button:** Automatically appends an additive `+` tab button in stack headers to open a configured `defaultComponent` tab at runtime.
- **Dynamic Tab Management:** Provides the `GoldenLayoutWrapper` class to mount Svelte components into layouts programmatically.
- **CSS Variable Theming:** Supports Hex, HSL, or named variables overrides (`theme` prop) to control backgrounds, splitters, tab states, borders, and drag indicators.
- **TailwindCSS Class Override Hooks:** Injects custom Tailwind utility classes (`componentParts` prop) directly into internal layout elements.

---

## API Reference

### Component Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`content`** | `GoldenLayoutContent<ComponentTypes>` | *Required* | Defines the initial layout structure of splitters, columns, rows, and component tabs. |
| **`components`** | `Record<ComponentTypes, Component>` | `{}` | Key-value mapping of type string names to Svelte Component classes. |
| **`layout`** | `GoldenLayoutWrapper \| null` | `null` | Bindable wrapper instance returned back to the parent to interact with Golden Layout programmatically (bindable). |
| **`defaultComponent`** | `Component` | *Required* | Svelte Component class mounted when the "+" button is clicked in stack headers. |
| **`componentParts`** | `GoldenLayoutComponentPartsTailwindCssOverrides` | `{}` | Tailored Tailwind CSS override classes for internal layout sections. |
| **`theme`** | `GoldenLayoutThemeCssColorsOverrides` | `{}` | Color overrides mapped to CSS variables for dynamic workspace styling. |
| **`class`** | `string` | `""` | Optional CSS class name applied directly to the root layout container element. |

---

## Structural Configurations (`content`)

Layout configurations match standard Golden Layout items (`RowOrColumnItemConfig`, `StackItemConfig`, or `ComponentItemConfig`):

- **Row (`type: 'row'`):** Places items side-by-side horizontally.
- **Column (`type: 'column'`):** Places items stacked vertically.
- **Stack (`type: 'stack'`):** Places items in tabbed panels.
- **Component (`type: 'component'`):** Renders the specified Svelte component.

```typescript
const Layout_InitialContent = {
  type: 'row',
  content: [
    {
      type: 'component',
      componentType: 'myCustomComponent',
      componentState: { label: 'A' }
    },
    {
      type: 'column',
      content: [
        {
          type: 'component',
          componentType: 'testComponent',
          componentState: { label: 'B' }
        }
      ]
    }
  ]
};
```

---

## Getting Started Example

This example demonstrates how to configure, style, and mount the Svelte 5 GoldenLayout component.

```svelte
<script lang="ts">
  import GoldenLayout from "../libs/GoldenLayout.svelte";
  import type { GoldenLayoutContent } from "../libs/GoldenLayout.types";
  import { GoldenLayoutWrapper } from "../libs/GoldenLayoutWrapper";
  
  // Custom Svelte Panels
  import ChapterCard from "../components/Widgets/ChapterCard.svelte";
  import TaskNode from "../components/Widgets/TaskNode.svelte";

  let Layout = $state<GoldenLayoutWrapper | null>(null);

  const componentsRegistry = {
    chaptersList: ChapterCard,
    tasklistPanel: TaskNode
  };

  const initialLayoutContent: GoldenLayoutContent<typeof componentsRegistry> = {
    type: 'row',
    content: [
      {
        type: 'component',
        componentType: 'chaptersList',
        componentState: { title: 'Celeste Map Chapters' }
      },
      {
        type: 'component',
        componentType: 'tasklistPanel',
        componentState: { title: 'Everest Config Tasks' }
      }
    ]
  };
</script>

<main class="dashboard-root">
  <div class="layout-container">
    <GoldenLayout
      bind:layout={Layout}
      content={initialLayoutContent}
      components={componentsRegistry}
      defaultComponent={TaskNode}
    />
  </div>
</main>

<style>
  .dashboard-root {
    width: 100vw;
    height: 100vh;
  }
  .layout-container {
    width: 100%;
    height: 100%;
  }
</style>
```

---

## Dynamic Tabs API (`GoldenLayoutWrapper`)

By binding `bind:layout={Layout}`, you receive an instance of `GoldenLayoutWrapper`. You can use it to open Svelte tabs dynamically during runtime.

### Methods

#### 1. `addSvelteTab`
Registers a Svelte component class dynamically under a unique identifier and adds it to the active stack.
```typescript
Layout?.addSvelteTab(
  TaskNode, // Svelte component class
  { title: "Dynamic Task list" }, // Props passed to the component
  "Mod Progress" // Tab title string
);
```

#### 2. `addSvelteTabAtLocation`
Mounts a Svelte component at a specific location selector.
```typescript
Layout?.addSvelteTabAtLocation(
  ChapterCard,
  { status: "locked" },
  "Dynamic Chapter Card",
  [{ type: 'stack' }] // Location selector stack
);
```

#### 3. `raw`
Returns the raw `GoldenLayout` instance. This is useful for subscribing to layout events (e.g. `stateChanged`, `tabActivated`, `itemDestroyed`).
```typescript
Layout?.raw.on('stateChanged', () => {
  console.log('Layout configuration updated by user action');
});
```

---

## Theme Customization (`theme`)

You can style the panels using the `theme` prop. Passing these values sets CSS variables that control the Golden Layout CSS.

```svelte
<GoldenLayout
  theme={{
    layoutBg: '#0f172a',        // Slate-900 (Main window background)
    contentBg: '#1e293b',       // Slate-800 (Panel background)
    contentBorder: '1px solid #334155', // Slate-700
    splitterBg: '#1e293b',      // Splitter bar
    splitterHoverBg: '#3b82f6', // Splitter bar hover glow
    headerBg: '#0f172a',        // Tab bar headers wrapper
    tabBg: '#1e293b',           // Normal tabs
    tabText: '#94a3b8',         // Tab title text
    activeTabBg: '#0f172a',     // Selected tab background
    activeTabText: '#3b82f6',   // Selected tab text glow
    tabHoverBg: '#334155',      // Tab hover state
    dragProxyBg: '#1e293b',     // Floating tab drag indicator
    dragProxyBorder: '2px dashed #3b82f6'
  }}
/>
```

---

## Tailwind CSS Overrides (`componentParts`)

You can inject Tailwind utility classes into individual internal sections of the layout. These will be merged with the default classes automatically at runtime.

```svelte
<GoldenLayout
  componentParts={{
    layout: "bg-slate-950",
    content: "bg-slate-900 border border-slate-800 text-slate-200",
    header: "bg-slate-950 border-b border-slate-900",
    tab: "bg-slate-900 text-slate-400 hover:bg-slate-850 transition-colors",
    activeTab: "bg-slate-800 text-purple-400 font-semibold border-t-2 border-purple-500",
    splitter: "bg-slate-950 hover:bg-purple-600/80 transition-colors duration-150",
    dragProxy: "bg-slate-900 border border-purple-500 rounded-md"
  }}
/>
```
