<script lang="ts">
import { Log_Info } from '../../Logger';
import type { ICanvasWidgetProps } from '../Canvas.types';
import BaseGlassWidget from './BaseGlassWidget.svelte';

type TextProps = { text: string };
type Props = ICanvasWidgetProps<TextProps>;
let { text, onChange }: Props = $props();

let isFocused = $state<boolean>(false);
let hasMadeClick = $state<boolean>(false);

// Usar $derived es correcto
let isEditable = $derived(isFocused && hasMadeClick);

function handleFocus() {
	isFocused = true;
	Log_Info('TextWidget:', 'FOCUS EVENT');
}

function handleClick() {
	hasMadeClick = true;
	Log_Info('TextWidget:', 'CLICK EVENT');
}

function handleBlur() {
	hasMadeClick = false;
	isFocused = false;
	Log_Info('TextWidget:', 'ONBLUR (OUT)');
}
</script>

<BaseGlassWidget id="text-widget-wrapper" baseColor="rgba(30, 30, 32, 0.7)">
  <textarea
    value={text}
    oninput={(e) => onChange?.({ text: e.currentTarget.value })}
    onfocus={handleFocus}
    onclick={handleClick}
    onblur={handleBlur}
    placeholder="Type here..."
    class:textarea-no-interactive={!isEditable}
    data-canvas-is-draggable={!isEditable ? '' : undefined}
  ></textarea>
</BaseGlassWidget>

<style>
  textarea {
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    resize: none;
    color: inherit;
    outline: none;
  }

  /* Solo quitamos el cursor y caret cuando NO es editable */
  textarea.textarea-no-interactive {
    cursor: default;
    caret-color: transparent;
    -webkit-user-select: none; /* Safari */
    -moz-user-select: none;    /* Old Firefox */
    -ms-user-select: none;     /* Internet Explorer/Edge */
    user-select: none;         /* Standard syntax (Chrome, Opera, Firefox) */
  }
</style>