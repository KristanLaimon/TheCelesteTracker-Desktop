<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import IconGithub from "~icons/mdi/github";

  interface AppState {
    is_game_installed: boolean;
    is_mod_db_initialized: boolean;
  }

  let appStatus = $state<AppState | null>(null);

  onMount(async () => {
    try {
      appStatus = await invoke<AppState>("get_current_app_status");
    } catch (e) {
      console.error("Failed to get app status:", e);
    }
  });

  const openModLink = async () => {
    await openUrl("https://github.com/KristanLaimon/TheCelesteTracker-Mod");
  };
</script>

{#if appStatus}
  {#if !appStatus.is_game_installed}
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <div
        class="max-w-md w-full bg-surface border border-primary p-8 rounded-2xl shadow-2xl text-center mx-4"
      >
        <div
          class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <span class="text-primary text-3xl">!</span>
        </div>
        <h2 class="text-3xl font-headline font-bold text-white mb-4">
          Celeste Not Found
        </h2>
        <p class="text-zinc-400 mb-6 font-medium leading-relaxed">
          We couldn't detect a Celeste installation on your system. Please make
          sure the game is installed through Steam and try again.
        </p>
        <div class="h-1 bg-primary/20 w-full rounded-full overflow-hidden">
          <div class="h-full bg-primary animate-pulse w-full"></div>
        </div>
      </div>
    </div>
  {:else if !appStatus.is_mod_db_initialized}
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <div
        class="max-w-md w-full bg-surface border border-secondary p-8 rounded-2xl shadow-2xl text-center mx-4"
      >
        <IconGithub class="text-6xl text-white mx-auto mb-6" />
        <h2 class="text-3xl font-headline font-bold text-white mb-4">
          Mod Required
        </h2>
        <p class="text-zinc-400 mb-8 font-medium leading-relaxed">
          The Tracker Mod is not initialized. Please download and install the
          required mod from GitHub to enable tracking features.
        </p>
        <button
          onclick={openModLink}
          class="w-full bg-secondary hover:bg-secondary/90 text-bg-base font-bold py-4 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <IconGithub class="text-xl" />
          <span>Get Tracker Mod</span>
        </button>
      </div>
    </div>
  {/if}
{/if}
