<script lang="ts">
  import TextWidget from '../components/Widgets/canvas_widgets/TextWidget.svelte';
  import CenteredLayout from '../layouts/CenteredLayout.svelte';
  import Canvas from '../libs/Canvas.svelte';
  import type { CanvasNodeData, CanvasRegistry, CanvasPersistence } from '../libs/Canvas.types';

  const registry = {
    textWidget: TextWidget,
  } satisfies CanvasRegistry;

  // Initialize nodes with default starting items (overwritten if localStorage has data)
  let nodes = $state<CanvasNodeData<typeof registry>[]>([
    {
      id: "1",
      type: "textWidget",
      x: 100,
      y: 150,
      props: {
        text: "Hello Celeste Modder!"
      }
    }
  ]);

  // Setup the persistence configuration object
  let persistence = $state<CanvasPersistence<typeof registry>>({
    key: "test-canvas-persistence",
    beforeSave: (nodes, _cancel) => {
      console.log("Canvas is about to save nodes:", nodes);
    },
    afterSave: (nodes) => {
      console.log("Canvas saved successfully:", nodes);
    }
  });
</script>

<CenteredLayout>
  <Canvas {registry} 
    classNames={{wrapper: "w-[80vw]"}} 
    mode="normal" 
    bind:nodes 
    bind:persistence
    showDots={true} 
  />
</CenteredLayout>
