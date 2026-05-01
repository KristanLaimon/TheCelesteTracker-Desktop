<script lang="ts">
  import type { Snippet } from 'svelte';

  type LinkCardProps = {
    icon?: Snippet;
    iconClass?: string;
    title: string;
    subtitle: string;
    href: string;
    disabled?: boolean;
    borderHoverClass?: string;
  }

  let {
    href,
    subtitle,
    title,
    icon,
    iconClass = "",
    disabled = false,
    borderHoverClass = "hover:border-primary/50"
  }: LinkCardProps = $props();
</script>

<a
    class="bg-card-bg border border-outline-muted p-6 rounded-2xl transition-all group {disabled ? 'opacity-50 pointer-events-none cursor-pointer' : borderHoverClass}"
    href={disabled ? '#' : href}
  >
    {#if icon}
      <div class="{iconClass} text-3xl mb-4 block group-hover:scale-105 transition-transform">
        {@render icon()}
      </div>
    {/if}
    <h3 class="font-headline font-bold text-white text-lg">{title}</h3>
    <p class="text-xs text-zinc-500 mt-1">{subtitle}</p>
</a>
