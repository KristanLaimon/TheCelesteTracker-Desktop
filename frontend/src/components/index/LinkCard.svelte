<script lang="ts">
import type { Snippet } from "svelte";

type LinkCardProps = {
	icon?: Snippet;
	iconClass?: string;
	title: string;
	subtitle: string;
	href: string;
	disabled?: boolean;
	borderHoverClass?: string;
};

let {
	href,
	subtitle,
	title,
	icon,
	iconClass = "",
	disabled = false,
	borderHoverClass = "hover:border-primary/50",
}: LinkCardProps = $props();
</script>

<a
    class="bg-card-bg border border-outline-muted p-3 md:p-4 rounded-xl transition-all group {disabled ? 'opacity-50 pointer-events-none cursor-pointer' : borderHoverClass}"
    href={disabled ? '#' : href}
  >
    <div class="flex items-center gap-3">
      {#if icon}
        <div class="{iconClass} text-xl md:text-2xl block group-hover:scale-110 transition-transform flex-shrink-0">
          {@render icon()}
        </div>
      {/if}
      <div class="min-w-0">
        <h3 class="font-headline font-bold text-white text-sm md:text-base truncate">{title}</h3>
        <p class="text-[10px] md:text-xs text-zinc-500 truncate">{subtitle}</p>
      </div>
    </div>
</a>
