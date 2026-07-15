<script lang="ts">
type Props = {
  text: string;
};

const { text }: Props = $props();
</script>

<article id="text-widget-wrapper">
  <p>{text}</p>
</article>

<style>
  #text-widget-wrapper {
    display: flex;
    padding: 0.3rem;
  }
</style>
