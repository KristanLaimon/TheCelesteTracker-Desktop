<script lang="ts">
import DomPurify from 'dompurify';
import { marked } from 'marked';
import { Log_Info } from '../../Logger';
import type { ICanvasWidgetProps } from '../Canvas.types';
import BaseGlassWidget from './BaseGlassWidget.svelte';

type TextProps = {
	rawTextContent: string /**Treated always as markdown content. Html rendered only in frontend, but stored as markdown*/;
	displayMode: 'markdown-rendered' | 'raw';
};
type Props = ICanvasWidgetProps<TextProps>;
let { rawTextContent = $bindable<string>(''), displayMode = $bindable('raw'), onChange }: Props = $props();

let textContentAsHtml = $derived<string>(DomPurify.sanitize(marked.parse(rawTextContent) as string));
let isFocused = $state<boolean>(false);
let hasMadeClick = $state<boolean>(false);
let isEditable = $derived(isFocused && hasMadeClick);
</script>

<BaseGlassWidget id="text-widget-wrapper" baseColor="rgba(30, 30, 32, 0.7)">
  <div class="widget-container">
    <!-- Rendered Markdown Layer -->
    <div class="markdown-display" class:hidden={isEditable}>
      {@html textContentAsHtml}
    </div>

    <!-- Editable Textarea Layer -->
    <textarea
      bind:value={rawTextContent}
      onchange={() => onChange?.({ rawTextContent, displayMode })}
      onfocus={()=> {isFocused = true; Log_Info('TextWidget:', 'FOCUS EVENT'); }}
      onclick={() => { hasMadeClick = true; Log_Info('TextWidget:', 'CLICK EVENT');}} 
      onblur={() => {isFocused = false; hasMadeClick = false; Log_Info('TextWidget:', 'ONBLUR (OUT)');}}
      placeholder="Type here..."
      class:textarea-no-interactive={!isEditable}
      data-canvas-is-draggable={!isEditable ? '' : undefined}
    ></textarea>

    <button class="display-button-toggle show">Hello</button>
  </div>
</BaseGlassWidget>

<style>
  .display-button-toggle {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    padding: 0.2rem 0.3rem;
    border-radius: 4px;
    font-size: 0.7rem;
    background-color: green;
    display: none;
  }

  .display-button-toggle.show {
      display: block
  }

  .widget-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .markdown-display {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0.6rem;
    pointer-events: none; /* Keeps clicks passing through to the textarea */
    overflow: auto;
  }

  .hidden {
    display: none;
  }

  textarea {
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    resize: none;
    color: inherit;
    outline: none;
    padding: 0.6rem;
    position: relative;
    z-index: 1;
  }

  /* Your existing classes preserved exactly as requested */
  textarea.textarea-no-interactive {
    color: transparent;
    cursor: default;
    caret-color: transparent;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  textarea.textarea-no-interactive::placeholder {
    color: #64748b;
  }
</style>