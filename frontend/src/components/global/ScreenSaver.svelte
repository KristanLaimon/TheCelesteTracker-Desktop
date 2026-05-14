<script lang="ts">
  import type { Snippet } from "svelte";
  import IconClose from "~icons/material-symbols/close";

  type Props = {
    text: string;
    detail?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
    children?: Snippet;
  };

  let { text, detail = "", dismissible = false, onDismiss, children }: Props = $props();
</script>

<div class="fixed inset-0 z-[150] flex items-center justify-center overflow-hidden bg-zinc-950/70 px-6 backdrop-blur-xl">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,120,140,0.14),transparent_34%),linear-gradient(180deg,rgba(19,19,21,0.2),rgba(19,19,21,0.86))]"></div>

  {#if dismissible}
    <button
      type="button"
      class="absolute right-5 top-12 z-10 flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-zinc-900/80 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
      aria-label="Close overlay"
      onclick={onDismiss}
    >
      <IconClose class="h-5 w-5" />
    </button>
  {/if}

  <section class="relative flex min-h-72 w-full max-w-2xl flex-col items-center justify-center text-center">
    <div class="mb-8 flex min-h-28 w-full items-center justify-center">
      {@render children?.()}
    </div>

    <div class="font-headline text-2xl font-bold text-white md:text-4xl">{text}</div>
    {#if detail}
      <p class="mt-3 max-w-xl text-sm leading-6 text-zinc-400">{detail}</p>
    {/if}
  </section>
</div>
