<script lang="ts">
import type { ICanvasWidgetProps } from '../../../libs/Canvas.types';

type TextProps = {
  text: string;
};

type Props = TextProps & ICanvasWidgetProps<TextProps>;

let { text, onChange }: Props = $props();
</script>

<article id="text-widget-wrapper">
  <textarea
    value={text}
    oninput={(e) => onChange?.({ text: e.currentTarget.value })}
    placeholder="Type here..."
  ></textarea>
</article>

<style>
  #text-widget-wrapper {
    display: flex;
    padding: 0.3rem;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
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
