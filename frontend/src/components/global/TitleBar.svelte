<script lang="ts">
  import { QuitApp, MaximiseApp } from "../../../wailsjs/go/main/App";
  import { WindowMinimise } from "../../../wailsjs/runtime";
  import IconClose from "~icons/material-symbols/close";
  import IconRemove from "~icons/material-symbols/remove";
  import IconSquareOutline from "~icons/material-symbols/square-outline";

  import StrawberryRedGif from "../../assets/gifs/red_strawberryy.gif";
</script>

<div
  class="fixed top-0 left-0 w-full h-8 bg-zinc-950/90 backdrop-blur-sm border-b border-outline-muted flex justify-between items-center z-[100]"
  style="--wails-draggable:drag"
>
  <div class="flex items-center gap-2 px-4 pointer-events-none">
    <img src={StrawberryRedGif.src} alt="strawberry_red_gif" class="w-auto h-6 object-contain" />
    <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">The Celeste Tracker</span>
  </div>

  <div class="flex items-center h-full no-drag" style="--wails-draggable:no-drag">
    <button
      onclick={WindowMinimise}
      class="h-full px-3 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
      title="Minimize"
    >
      <IconRemove class="w-4 h-4" />
    </button>
    <button
      onclick={MaximiseApp}
      class="h-full px-3 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
      title="Maximize"
    >
      <IconSquareOutline class="w-3.5 h-3.5" />
    </button>
    <button
      onclick={QuitApp}
      class="h-full px-3 text-zinc-500 hover:text-white hover:bg-red-600 transition-colors"
      title="Close"
    >
      <IconClose class="w-4 h-4" />
    </button>
  </div>
</div>

<style>
  .no-drag {
    --wails-draggable: no-drag;
  }
</style>
