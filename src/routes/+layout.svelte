<script lang="ts">
    import type { Snippet } from "svelte";

    import { useCelesteLogic } from '$lib/logic/celeste_logic.svelte';
    import CelesteOverlay from '$lib/components/main/CelesteOverlay.svelte';
    import Header from '$lib/components/main/Header.svelte';
    import Footer from '$lib/components/main/Footer.svelte';
    import Toaster from '$lib/components/main/Toaster.svelte';
    import '../app.css';

    let { children } = $props() as {children:Snippet<[]>};
    
    // Logic extracted to separate file
    useCelesteLogic();
</script>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
</style>

<CelesteOverlay />
<Toaster />

<Header/>
{@render children()}
<div style="height: 4rem;"></div>
<Footer height="2.5rem"/>

<Footer height="2.5rem"/>

