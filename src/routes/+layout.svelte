<script lang="ts">
    import { LayoutPropsState } from '$lib/state.svelte';
    import '../app.css';

    let { children, data } = $props();

    $effect(() => {
        // Use data from load() for zero-flash initial paint
        // Use state for dynamic mid-page updates
        const activeClass = data?.bodyClassName || LayoutPropsState.bodyClass;
        if (activeClass) {
            document.body.className = activeClass;
        }
    });
</script>

{@render children()}
