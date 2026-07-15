<script lang="ts">
  import TextWidget from "../components/Widgets/canvas_widgets/TextWidget.svelte";
  import CenteredLayout from "../layouts/CenteredLayout.svelte";
  import Canvas from "../libs/Canvas.svelte";
  import { CanvasRegistry } from "../libs/Canvas.types";
  import type { AnySvelteComponent } from "../types/svelte.custom.types";

  const registry = {
    textWidget: TextWidget,
  } satisfies CanvasRegistry;
</script>

<CenteredLayout>
  <Canvas />
</CenteredLayout>
