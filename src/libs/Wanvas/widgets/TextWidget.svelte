<script lang="ts">
import DomPurify from "dompurify";
import { marked } from "marked";
import { onDestroy } from "svelte";
import { Log_Info } from "../../Logger";
import type { ICanvasWidgetProps } from "../Canvas.types";
import BaseGlassWidget from "./BaseGlassWidget.svelte";

type TextProps = {
	rawTextContent?: string /**Treated always as markdown content. Html rendered only in frontend, but stored as markdown*/;
	displayMode?: "markdown-rendered" | "raw";
};
type Props = ICanvasWidgetProps<TextProps>;
let { rawTextContent = $bindable<string>(""), displayMode = $bindable("raw"), onChange }: Props = $props();

let textContentAsHtml = $derived<string>(DomPurify.sanitize(marked.parse(rawTextContent) as string));
let isFocused = $state<boolean>(false);
let hasMadeClick = $state<boolean>(false);
let isEditable = $derived(isFocused && hasMadeClick);

let isTyping = $state<boolean>(false);
let typingTimeout: ReturnType<typeof setTimeout>;

function resetTypingTimer() {
	isTyping = true;
	clearTimeout(typingTimeout);
	typingTimeout = setTimeout(() => {
		isTyping = false;
	}, 1500);
}

onDestroy(() => {
	clearTimeout(typingTimeout);
});
</script>

<BaseGlassWidget id="text-widget-wrapper" baseColor="rgba(30, 30, 32, 0.7)">
  <div class="widget-container">
    <!-- Rendered Markdown Layer -->
    <div class="markdown-display" class:hidden={displayMode !== 'markdown-rendered' || isEditable}>
      {@html textContentAsHtml}
    </div>

    <!-- Editable Textarea Layer -->
    <textarea
      bind:value={rawTextContent}
      onchange={() => onChange?.({ rawTextContent, displayMode })}
      onfocus={()=> {isFocused = true; Log_Info('TextWidget:', 'FOCUS EVENT'); resetTypingTimer(); }}
      onclick={() => { hasMadeClick = true; Log_Info('TextWidget:', 'CLICK EVENT'); resetTypingTimer(); }} 
      onblur={() => {isFocused = false; hasMadeClick = false; Log_Info('TextWidget:', 'ONBLUR (OUT)');}}
      oninput={resetTypingTimer}
      onkeydown={resetTypingTimer}
      placeholder="Type here..."
      class:textarea-no-interactive={!isEditable && displayMode === 'markdown-rendered'}
      data-canvas-is-draggable={!isEditable ? '' : undefined}
    ></textarea>
    <button
      type="button"
      class="display-button-toggle"
      class:hidden-typing={isTyping}
      onpointerdown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onclick={(e) => {
        e.stopPropagation();
        displayMode = displayMode === 'raw' ? 'markdown-rendered' : 'raw';
        onChange?.({ rawTextContent, displayMode });
      }}
    >
      <span class="toggle-mode" class:active={displayMode === 'raw'}>Raw</span>
      <span class="toggle-separator">/</span>
      <span class="toggle-mode" class:active={displayMode === 'markdown-rendered'}>MD</span>
    </button>
  </div>
</BaseGlassWidget>

<style>
  .display-button-toggle {
    position: absolute;
    bottom: 8px;
    right: 8px;
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(30, 30, 32, 0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    z-index: 15;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    user-select: none;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease-in-out, background 0.15s, border-color 0.15s, transform 0.15s;
  }

  .widget-container:hover .display-button-toggle:not(.hidden-typing) {
    opacity: 1;
    pointer-events: auto;
    transition: opacity 0.08s ease-in-out, background 0.15s, border-color 0.15s, transform 0.15s;
  }

  .display-button-toggle.hidden-typing {
    opacity: 0 !important;
    pointer-events: none !important;
  }

  .display-button-toggle:hover {
    background: rgba(45, 45, 48, 0.85);
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.02);
  }

  .display-button-toggle:active {
    transform: scale(0.98);
  }

  .toggle-mode {
    opacity: 0.4;
    transition: opacity 0.15s;
  }

  .toggle-mode.active {
    opacity: 1;
    color: #a855f7;
  }

  .toggle-separator {
    opacity: 0.25;
    color: #ffffff;
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

  /* Scoped HTML tags styles inside rendered markdown view */
  .markdown-display :global(h1),
  .markdown-display :global(h2),
  .markdown-display :global(h3),
  .markdown-display :global(h4),
  .markdown-display :global(h5),
  .markdown-display :global(h6) {
    margin-top: 0.8rem;
    margin-bottom: 0.4rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.25;
  }

  .markdown-display :global(h1) {
    font-size: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.2rem;
  }
  .markdown-display :global(h2) { font-size: 1.25rem; }
  .markdown-display :global(h3) { font-size: 1.1rem; }
  .markdown-display :global(h4) { font-size: 1.0rem; }

  .markdown-display :global(p) {
    margin-top: 0;
    margin-bottom: 0.6rem;
    line-height: 1.5;
    color: #cbd5e1;
  }

  .markdown-display :global(strong),
  .markdown-display :global(b) {
    font-weight: 700;
    color: #ffffff;
  }

  .markdown-display :global(em),
  .markdown-display :global(i) {
    font-style: italic;
    color: #cbd5e1;
  }

  .markdown-display :global(ul) {
    list-style-type: disc;
    margin-top: 0;
    margin-bottom: 0.6rem;
    padding-left: 1.2rem;
  }

  .markdown-display :global(ol) {
    list-style-type: decimal;
    margin-top: 0;
    margin-bottom: 0.6rem;
    padding-left: 1.2rem;
  }

  .markdown-display :global(li) {
    margin-bottom: 0.2rem;
    line-height: 1.4;
    color: #cbd5e1;
  }

  .markdown-display :global(a) {
    color: #c084fc;
    text-decoration: none;
  }

  .markdown-display :global(a:hover) {
    text-decoration: underline;
  }

  .markdown-display :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.85em;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 0.1rem 0.25rem;
    border-radius: 4px;
    color: #f472b6;
  }

  .markdown-display :global(pre) {
    margin-top: 0;
    margin-bottom: 0.6rem;
    padding: 0.5rem;
    overflow: auto;
    background-color: rgba(15, 15, 17, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
  }

  .markdown-display :global(pre code) {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
    color: #e2e8f0;
    font-size: 0.85rem;
  }

  .markdown-display :global(blockquote) {
    margin: 0 0 0.6rem 0;
    padding-left: 0.6rem;
    border-left: 3px solid #a855f7;
    color: #94a3b8;
    font-style: italic;
  }

  .markdown-display :global(hr) {
    height: 1px;
    border: none;
    background-color: rgba(255, 255, 255, 0.1);
    margin: 0.8rem 0;
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