<script lang="ts">
import { router } from './router.svelte';
import './routes';
</script>

{#if router.page.component}
  <svelte:component this={router.page.component} />
{:else}
  <h2>404 Not Found</h2>
  <p>The page <code>{router.page.path}</code> could not be found.</p>
{/if}
