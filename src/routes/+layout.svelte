<script lang="ts">
    import { onMount } from 'svelte';
    import { listen } from '@tauri-apps/api/event';
    import type { CelesteEvent } from '$lib/types/events';
    import '../app.css';

    let { children } = $props();

</script>

{@render children()}
