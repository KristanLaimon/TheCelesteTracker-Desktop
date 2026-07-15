<script lang="ts">
import type { ICanvasWidgetProps } from '../../../libs/Canvas.types';

type TextProps = {
	text: string;
};
type Props = ICanvasWidgetProps<TextProps>;
let { text, onChange }: Props = $props();

let isInteractive = $state<boolean>(false);
</script>

<article id="text-widget-wrapper">
  <textarea
    value={text}
    oninput={(e) => onChange?.({ text: e.currentTarget.value })}
    placeholder="Type here..."
    class:no-interactive={!isInteractive}
  ></textarea>
</article>

<style>
  #text-widget-wrapper {
    display: flex;
    padding: 0.8rem;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: rgba(30, 30, 32, 0.7);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    color: #e0e0e0;
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
