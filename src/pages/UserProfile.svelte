<script lang="ts">
  import { router } from "../router.svelte";
</script>

<h2>User Profile / Search</h2>
{#if router.page.params.id}
  <p>User ID: <strong>{router.page.params.id}</strong></p>
{/if}
<p>Query Parameters: <code>{JSON.stringify(router.page.query)}</code></p>
<p>URL Hash: <strong>{router.page.hash || "none"}</strong></p>
