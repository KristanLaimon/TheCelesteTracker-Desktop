<script lang="ts">
  import { toast } from "./Toaster.svelte.js";
  import { fly } from "svelte/transition";
  import { backOut } from "svelte/easing";

  const typeColors = {
    success: "border-green-500/50 bg-green-500/10 text-green-400",
    error: "border-red-500/50 bg-red-500/10 text-red-400",
    info: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  };

  const typeIcons = {
    success: "check_circle",
    error: "error",
    info: "info",
    warning: "warning",
  };
</script>

<div
  class="fixed top-6 right-6 z-100 flex flex-col gap-3 w-80 pointer-events-none"
>
  {#each toast.toasts as t (t.id)}
    <div
      transition:fly={{ x: 300, duration: 400, easing: backOut }}
      class="pointer-events-auto relative p-4 rounded-xl border backdrop-blur-md shadow-2xl flex gap-3 group {typeColors[
        t.type
      ]}"
    >
      <span class="material-symbols-outlined text-xl shrink-0"
        >{typeIcons[t.type]}</span
      >
      <div class="flex flex-col gap-0.5 min-w-0">
        <span class="font-headline font-bold text-sm leading-tight text-white"
          >{t.message}</span
        >
        {#if t.description}
          <span class="text-[11px] opacity-70 leading-snug line-clamp-2"
            >{t.description}</span
          >
        {/if}
      </div>
      <button
        onclick={() => toast.remove(t.id)}
        class="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
      >
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  {/each}
</div>
