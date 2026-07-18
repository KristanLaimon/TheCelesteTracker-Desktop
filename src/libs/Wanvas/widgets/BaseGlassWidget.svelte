<script lang="ts">
import type { Snippet } from 'svelte';

let {
	disableGlassBackground = false,
	baseColor = 'rgba(30, 30, 35, 0.7)',
	borderRadius = '12px',
	class: className = '',
	style = '',
	children,
	...restProps
}: {
	disableGlassBackground?: boolean;
	baseColor?: string;
	borderRadius?: string | number;
	class?: string;
	style?: string;
	children?: Snippet;
	[key: string]: unknown;
} = $props();

const radiusValue = $derived(typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius);
</script>

<!-- ponytail: reusable glass wrapper component -->
<div
  class="base-glass-widget {className}"
  class:glass={!disableGlassBackground}
  style="background-color: {baseColor}; border-radius: {radiusValue}; {style}"
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</div>

<style>
  .base-glass-widget {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    position: relative;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .base-glass-widget.glass {
    backdrop-filter: blur(16px);
  }
</style>
