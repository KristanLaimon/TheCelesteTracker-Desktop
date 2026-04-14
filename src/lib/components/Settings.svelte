<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  
  // unplugin-icons: individual imports from virtual namespace
  import Settings from "~icons/lucide/settings";
  import Palette from "~icons/lucide/palette";
  import Play from "~icons/lucide/play";
  import Save from "~icons/lucide/save";
  import X from "~icons/lucide/x";
  import Moon from "~icons/lucide/moon";
  import Sun from "~icons/lucide/sun";

  import type { AppSettings } from "../types/entities";

  let { onclose }: { onclose: () => void } = $props();

  let start_behavior = $state<AppSettings['start_behavior']>("main-menu");
  let theme = $state("dark");
  let last_active_slot = $state(0);
  let isSaving = $state(false);

  onMount(async () => {
    // @ts-ignore
    if (!window.__TAURI_INTERNALS__) return;

    try {
      const config = await invoke<AppSettings>("get_settings");
      start_behavior = config.start_behavior;
      theme = config.theme;
      last_active_slot = config.last_active_slot;
    } catch (e) {
      console.error(e);
    }
  });

  async function handleSave() {
    isSaving = true;
    try {
      await invoke("save_settings", {
        settings: {
          start_behavior,
          theme,
          last_active_slot
        }
      });
      // Force reload to apply theme changes globally
      window.location.reload();
    } catch (e) {
      alert(e);
    } finally {
      isSaving = false;
    }
  }

  const themes = [
    { id: "dark", name: "Deep Dark", icon: Moon },
    { id: "light", name: "Clean Light", icon: Sun },
    { id: "celeste-dark", name: "Celeste Night", icon: Palette },
    { id: "celeste-light", name: "Mountain Day", icon: Palette },
  ];
</script>

<div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
  <div class="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
    <div class="p-6 border-b border-border flex justify-between items-center bg-muted/30">
      <div class="flex items-center gap-3">
        <Settings class="w-5 h-5 text-primary" />
        <h2 class="text-xl font-black tracking-tight">App Settings</h2>
      </div>
      <button onclick={onclose} class="p-2 hover:bg-accent rounded-full transition-colors">
        <X class="w-5 h-5" />
      </button>
    </div>

    <div class="p-8 space-y-8">
      <!-- Start Behavior -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <Play class="w-4 h-4 text-muted-foreground" />
          <h3 class="text-xs font-black uppercase tracking-widest text-muted-foreground">Startup Behavior</h3>
        </div>
        <div class="grid grid-cols-1 gap-2">
          {#each ["main-menu", "last-session"] as behavior}
            <button
              onclick={() => start_behavior = behavior}
              class="flex items-center justify-between p-4 rounded-xl border-2 transition-all {start_behavior === behavior ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'}"
            >
              <span class="font-bold capitalize">{behavior.replace('-', ' ')}</span>
              {#if start_behavior === behavior}
                <div class="w-2 h-2 rounded-full bg-primary"></div>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Theme Selection -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <Palette class="w-4 h-4 text-muted-foreground" />
          <h3 class="text-xs font-black uppercase tracking-widest text-muted-foreground">Visual Theme</h3>
        </div>
        <div class="grid grid-cols-2 gap-3">
          {#each themes as t}
            <button
              onclick={() => theme = t.id}
              class="flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all {theme === t.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'}"
            >
              <t.icon class="w-6 h-6 {theme === t.id ? 'text-primary' : 'text-muted-foreground'}" />
              <span class="text-xs font-bold">{t.name}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="p-6 bg-muted/30 border-t border-border">
      <button
        onclick={handleSave}
        disabled={isSaving}
        class="w-full bg-primary text-primary-foreground hover:brightness-110 py-4 rounded-xl font-black shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save class="w-5 h-5" />
        Save & Apply Changes
      </button>
    </div>
  </div>
</div>
