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
        try {
            const settings = await invoke<{ start_behavior: string, last_active_slot: number, theme: string }>("get_settings");
            currentTheme = settings.theme;
            
            if (settings.start_behavior === "last-session") {
                // Navigate to last campaign or general view
                // For now, if last-session, we just go to collections
                goto("/collections");
            } else if (settings.start_behavior === "specific") {
                goto("/collections"); // Placeholder for specific
            }
        } catch (e) {
          console.error("Failed to load settings for navigation", e);
        }
    });
</script>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
</style>

<CelesteOverlay />
<Toaster />

<div class={currentTheme} style="min-height: 100vh; background-color: var(--background); color: var(--foreground);">
  <Header/>
  {@render children()}
  <div style="height: 4rem;"></div>
  <Footer height="2.5rem"/>
  <Footer height="2.5rem"/>
</div>

