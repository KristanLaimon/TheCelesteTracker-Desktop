<script lang="ts">
// import Neutralino from '@neutralinojs/lib';
import "reflect-metadata";
import { router } from './router.svelte';
import './router_setup';
import './libs/Hotkeys';

</script>

{#if router.page.component}
  {#key router.url.pathname + router.url.search}
    <router.page.component />
  {/key}
{:else}
  <h2>404 Not Found</h2>
  <p>The page <code>{router.page.path}</code> could not be found.</p>
{/if}
