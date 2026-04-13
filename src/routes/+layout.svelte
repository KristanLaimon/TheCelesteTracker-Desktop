<script lang="ts">
    import { LayoutPropsState } from '$lib/state.svelte';
    import { useCelesteLogic } from '$lib/logic/celeste_logic.svelte';
    import CelesteOverlay from '$lib/components/main/CelesteOverlay.svelte';
    import '../app.css';

    let { children, data } = $props();
    
    // Logic extracted to separate file
    useCelesteLogic();

    $effect(() => {
        const activeClass = (data as any).bodyClassName || LayoutPropsState.bodyClass;
        if (activeClass) {
            document.body.className = activeClass;
        }
    });
</script>

{@render children()}

<!-- Live Overlay extracted to component -->
<CelesteOverlay />

<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
</style>
