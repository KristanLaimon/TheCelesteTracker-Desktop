<script lang="ts">
import type { ICanvasWidgetProps } from '../Canvas.types';
import BaseGlassWidget from './BaseGlassWidget.svelte';

type TextProps = {
	text: string;
};
type Props = ICanvasWidgetProps<TextProps>;
let { text, onChange }: Props = $props();

let isInteractive = $state<boolean>(false);
</script>

<!-- ponytail: reuse BaseGlassWidget to keep UI consistent and glassmorphic -->
<BaseGlassWidget id="text-widget-wrapper" baseColor="rgba(30, 30, 32, 0.7)">
  <textarea
    value={text}
    oninput={(e) => onChange?.({ text: e.currentTarget.value })}
    placeholder="Type here..."
    class:no-interactive={!isInteractive}
  ></textarea>
</BaseGlassWidget>

<style>
  :global(#text-widget-wrapper) {
    display: flex !important;
    padding: 0.8rem !important;
    color: #e0e0e0 !important;
  }
  textarea {
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    resize: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    outline: none;
  }
</style>
