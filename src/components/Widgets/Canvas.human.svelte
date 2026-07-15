<script lang="ts">
  import { onMount } from "svelte";
  import Panzoom from "@panzoom/panzoom";

  onMount(() => {
    const HTML_CanvasWrapper = document.getElementById(
      "canvas-wrapper",
    ) as HTMLElement | null;
    if (HTML_CanvasWrapper === null) return;

    const Panzoom_CanvasWrapper = Panzoom(HTML_CanvasWrapper);

    HTML_CanvasWrapper.addEventListener("wheel", (e) => {
      const direction = Math.sign(e.deltaY) > 0 ? "down" : "up";

      if (direction === "down") Panzoom_CanvasWrapper.zoomIn({ animate: true });
      else Panzoom_CanvasWrapper.zoomOut({ animate: true });
    });
  });
</script>

<section id="canvas-wrapper">
  <p>Hola</p>
</section>

<style>
  #canvas-wrapper {
    background-repeat: repeat;
    background-size: 40px 40px;
    background-image: radial-gradient(circle, #3a3a3a 2px, transparent 2px);
    background-color: #181818;

    width: 95%;
    height: 95%;
  }
</style>
