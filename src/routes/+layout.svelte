<script lang="ts">
    import '../app.css';
    import type { Snippet } from "svelte";
    import GlobalHeader from '$lib/components/global/Header.svelte';
    import GlobalFooter from '$lib/components/global/Footer.svelte';

    let { children } = $props() as {children:Snippet<[]>};
</script>

<div class="min-h-screen text-white">
  <GlobalHeader />
  <main class="grow">
    {@render children()}
  </main>
  <div class="h-18"> <!-- Space to show the footer as well --></div>
  <GlobalFooter height="2.5rem" />
</div>
