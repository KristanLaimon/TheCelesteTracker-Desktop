<script lang="ts">
    import type { Snippet } from "svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { invoke } from "@tauri-apps/api/core";

    import { useCelesteLogic } from '$lib/logic/celeste_logic.svelte';
    import CelesteOverlay from '$lib/components/main/CelesteOverlay.svelte';
    import Header from '$lib/components/main/Header.svelte';
    import Footer from '$lib/components/main/Footer.svelte';
    import Toaster from '$lib/components/main/Toaster.svelte';
    import '../app.css';

    let { children } = $props() as {children:Snippet<[]>};

    // Logic extracted to separate file
    useCelesteLogic();

    let currentTheme = $state("dark");

    onMount(async () => {
        // @ts-ignore
        if (!window.__TAURI_INTERNALS__) return;

        try {
            const settings = await invoke<{ start_behavior: string, last_active_slot: number, theme: string }>("get_settings");
            currentTheme = settings.theme;
            
            if (settings.start_behavior === "last-session") {
                goto("/collections");
            } else if (settings.start_behavior === "specific") {
                goto("/collections");
            }
        } catch (e) {
          console.error("Failed to load settings for navigation", e);
        }
    });
</script>

<div class={currentTheme} style="min-height: 100vh; background-color: var(--background); color: var(--foreground);">
  <Header />
  
  <div class="relative z-0">
    {@render children()}
  </div>

  <Footer height="2.5rem" />
  
  <CelesteOverlay />
  <Toaster />
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');
</style>
