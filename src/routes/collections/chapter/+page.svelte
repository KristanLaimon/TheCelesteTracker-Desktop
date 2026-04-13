<script lang="ts">
  import ChapterView from "./ChapterView.svelte";
</script>

<div id="page-collection-detail" class="min-h-screen">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
    <!-- View Selectors (Need to be at this level for CSS sibling logic if used) -->
    <input
      checked
      class="view-toggle-input hidden"
      id="table-view-trigger"
      name="view-switcher"
      type="radio"
    />
    <input
      class="view-toggle-input hidden"
      id="grid-view-trigger"
      name="view-switcher"
      type="radio"
    />

    <ChapterView />
  </div>

  <!-- FAB -->
  <div class="fixed bottom-6 sm:bottom-8 right-6 sm:right-8 z-50">
    <button
      class="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[var(--mapscollection-primary)]"
      style="background: var(--mapscollection-primary); color: var(--mapscollection-on-primary)"
    >
      <span class="material-symbols-outlined text-2xl sm:text-3xl">add</span>
    </button>
  </div>
</div>

<style>
  #page-collection-detail {
    --mapscollection-bg: #131315;
    --mapscollection-surface: #1c1c1f;
    --mapscollection-surface-dim: #18181b;
    --mapscollection-surface-bright: #27272a;
    --mapscollection-primary: #ff788c;
    --mapscollection-primary-dim: #ff6e85;
    --mapscollection-on-primary: #520017;
    --mapscollection-secondary: #67d8d2;
    --mapscollection-tertiary: #ffc971;
    --mapscollection-outline: rgba(255, 255, 255, 0.08);
    --mapscollection-on-surface: #f4f4f5;
    --mapscollection-on-surface-variant: #a1a1aa;
    --mapscollection-glass: rgba(24, 24, 27, 0.85);
    --mapscollection-glow: rgba(255, 120, 140, 0.15);
    --mapscollection-textarea-bg: rgba(9, 9, 11, 0.4);
    --mapscollection-textarea-edit-bg: rgba(9, 9, 11, 0.8);

    background-color: var(--mapscollection-bg);
    color: var(--mapscollection-on-surface);
  }

  :global(.view-toggle-input:checked + .view-toggle-label) {
    background-color: var(--mapscollection-primary) !important;
    color: var(--mapscollection-on-primary) !important;
  }

  /* View Toggle Logic using global because ChapterView is a child */
  :global(#grid-view-trigger:checked ~ * #table-view-container) {
    display: none !important;
  }
  :global(#grid-view-trigger:checked ~ * #grid-view-container) {
    display: grid !important;
  }
  :global(#table-view-trigger:checked ~ * #grid-view-container) {
    display: none !important;
  }
  :global(#table-view-trigger:checked ~ * #table-view-container) {
    display: block !important;
  }

  :global(.achievement-card) {
    transition: all 0.3s ease;
    border-color: var(--mapscollection-outline);
  }
  :global(.achievement-card:hover) {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px -10px var(--mapscollection-glow);
    border-color: var(--mapscollection-primary);
  }

  :global(.description-container) {
    background: var(--mapscollection-textarea-bg);
    border-color: var(--mapscollection-outline);
    transition: all 0.3s ease;
  }
  :global(#edit-description-toggle:checked ~ .description-container) {
    background: var(--mapscollection-textarea-edit-bg);
    border-color: var(--mapscollection-primary);
  }
  :global(#edit-description-toggle:checked ~ .description-container .edit-icon) {
    display: none;
  }
  :global(#edit-description-toggle:checked ~ .description-container .save-icon) {
    display: block;
  }
  :global(#edit-description-toggle:not(:checked) ~ .description-container .save-icon) {
    display: none;
  }
</style>
