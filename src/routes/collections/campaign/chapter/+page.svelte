<script lang="ts">
  import ChapterDeepDive from "./ChapterDeepDive.svelte";
</script>

<div id="page-chapter-info" class="min-h-screen">
  <div class="mx-auto max-w-7xl px-4 py-8 space-y-12 sm:px-8 lg:px-12">
    <ChapterDeepDive />
  </div>

  <!-- Sticky Bottom Bar -->
  <div
    class="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-4 sm:bottom-8 sm:right-12"
  >
    <div
      class="glass-panel space-y-4 rounded-2xl border border-white/10 p-3 shadow-2xl sm:p-4"
    >
      <button
        class="flex items-center gap-3 text-(--chapter-info-secondary) transition-colors hover:text-white"
      >
        <span class="material-symbols-outlined">share</span>
        <span class="text-[10px] font-bold uppercase tracking-widest sm:text-xs"
          >Share Run</span
        >
      </button>
      <div class="h-px bg-white/10"></div>
      <button
        class="flex items-center gap-3 text-zinc-400 transition-colors hover:text-white"
      >
        <span class="material-symbols-outlined">edit</span>
        <span class="text-[10px] font-bold uppercase tracking-widest sm:text-xs"
          >Edit Details</span
        >
      </button>
    </div>
    <button
      class="flex h-14 w-14 items-center justify-center rounded-full bg-(--chapter-info-primary) text-white shadow-[0_12px_24px_rgba(255,120,140,0.3)] transition-all hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
    >
      <span
        class="material-symbols-outlined text-2xl sm:text-3xl"
        style="font-variation-settings: 'FILL' 1;">play_arrow</span
      >
    </button>
  </div>
</div>

<style>
  #page-chapter-info {
    --chapter-info-primary: #ff788c;
    --chapter-info-primary-container: #520017;
    --chapter-info-secondary: #67d8d2;
    --chapter-info-tertiary: #ffc971;
    --chapter-info-bg: #131315;
    --chapter-info-surface: #18181b;
    --chapter-info-surface-high: #27272a;
    --chapter-info-outline: rgba(255, 255, 255, 0.08);
    --chapter-info-glass: rgba(24, 24, 27, 0.85);
    --chapter-info-glass-filter: blur(12px);
    --chapter-info-strawberry-glow: 0 0 40px rgba(255, 120, 140, 0.1);
    --chapter-info-hero-gradient: linear-gradient(
      to top,
      #131315,
      rgba(19, 19, 21, 0.4),
      transparent
    );
    --chapter-info-hero-overlay: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.8),
      transparent
    );

    /* Font Mappings */
    --font-headline: "Space Grotesk", sans-serif;
    --font-body: "Manrope", sans-serif;

    background-color: var(--chapter-info-bg);
    color: #f4f4f5;
    font-family: var(--font-body);
  }

  :global(.glass-panel) {
    background: var(--chapter-info-glass);
    backdrop-filter: var(--chapter-info-glass-filter);
  }

  /* Peer-checked logic across component boundaries */
  :global(#edit-description-toggle:checked ~ div > .peer-checked\:hidden) {
    display: none !important;
  }
  :global(#edit-description-toggle:checked ~ .hidden.peer-checked\:block) {
    display: block !important;
  }
  :global(#edit-opinion-toggle:checked ~ div > .peer-checked\:hidden) {
    display: none !important;
  }
  :global(#edit-opinion-toggle:checked ~ .hidden.peer-checked\:block) {
    display: block !important;
  }

  :global(.material-symbols-outlined) {
    font-variation-settings:
      "FILL" 0,
      "wght" 400,
      "GRAD" 0,
      "opsz" 24;
  }
</style>
