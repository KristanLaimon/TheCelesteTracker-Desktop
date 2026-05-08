<script lang="ts">
  import IconPlus from '~icons/material-symbols/add';

  interface Props {
    onclick: () => void;
  }

  let { onclick }: Props = $props();
</script>

<button
  {onclick}
  class="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-outline-muted hover:border-primary hover:bg-primary/5 transition-all group h-48"
>
  <IconPlus class="text-4xl text-zinc-500 group-hover:text-primary mb-2 transition-colors" />
  <span class="font-bold text-zinc-400 group-hover:text-white transition-colors">Create Collection</span>
</button>
