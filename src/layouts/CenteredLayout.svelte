<script lang="ts">
import type { Snippet } from 'svelte';

type Props = {
  width?: string;
  height?: string;
  children?: Snippet;
};

const { width = '100vw', height = '100vh', children }: Props = $props();
</script>

<main class="centered-layout-wrapper" style:width style:height>
  {@render children?.()}
</main>

<style>
  .centered-layout-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: fit-content;
    height: fit-content;
  }
</style>
