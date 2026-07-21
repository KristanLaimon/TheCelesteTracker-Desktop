<script lang="ts">
  import CenteredLayout from "../../layouts/CenteredLayout.svelte";
  type Props = {
    ModId?: string | null;
  };

  let { ModId = $bindable(null) }: Props = $props();
</script>

<CenteredLayout height="100%" width="100%">
  <article>
    <div>
      <h2>No mod selected!</h2>
    </div>
  </article>
</CenteredLayout>

{#if ModId === null}{/if}
<h1>My main mod!</h1>
