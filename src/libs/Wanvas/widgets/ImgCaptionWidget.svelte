<script lang="ts">
import type { ICanvasWidgetProps } from "../Canvas.types";
import BaseGlassWidget from "./BaseGlassWidget.svelte";
import ImgWidget from "./ImgWidget.svelte";
import TextWidget from "./TextWidget.svelte";

type ImgWidgetSizeSubProp = {
	mode: "custom" | "keep-aspect-ratio-always";
	width?: number;
	height?: number;
};

type ImgCaptionProps = {
	srcUrl?: string;
	size?: ImgWidgetSizeSubProp;
	rawTextContent?: string;
	displayMode?: "markdown-rendered" | "raw";
};

type Props = ICanvasWidgetProps<ImgCaptionProps>;

let {
	srcUrl = $bindable(""),
	size = $bindable({ mode: "keep-aspect-ratio-always" }),
	rawTextContent = $bindable(""),
	displayMode = $bindable("raw"),
	onChange,
}: Props = $props();

function handleTextChange(updatedTextProps: { rawTextContent?: string; displayMode?: "markdown-rendered" | "raw" }) {
	if (updatedTextProps.rawTextContent !== undefined) {
		rawTextContent = updatedTextProps.rawTextContent;
	}
	if (updatedTextProps.displayMode !== undefined) {
		displayMode = updatedTextProps.displayMode;
	}
	onChange?.({ srcUrl, size, rawTextContent, displayMode });
}
</script>

<BaseGlassWidget class="img-caption-widget-wrapper" baseColor="rgba(30, 30, 32, 0.7)">
  <div class="img-caption-container">
    <div class="img-section">
      <ImgWidget srcUrl={srcUrl} size={size} />
    </div>
    <div class="text-section">
      <TextWidget
        bind:rawTextContent={rawTextContent}
        bind:displayMode={displayMode}
        onChange={handleTextChange}
      />
    </div>
  </div>
</BaseGlassWidget>

<style>
  .img-caption-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .img-section {
    flex: 1 1 0%;
    min-height: 0;
    position: relative;
  }

  .text-section {
    flex: 0 0 35%;
    min-height: 60px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;
  }

  /* Override inner BaseGlassWidgets to integrate them into a single glass panel */
  .img-caption-container :global(.base-glass-widget) {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border-radius: 0 !important;
    height: 100% !important;
    width: 100% !important;
  }
</style>
