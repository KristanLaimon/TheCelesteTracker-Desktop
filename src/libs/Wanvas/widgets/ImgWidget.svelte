<script lang="ts">
import type { ICanvasWidgetProps } from "../Canvas.types";
import BaseGlassWidget from "./BaseGlassWidget.svelte";

type ImgWidgetSizeSubProp = {
	mode: "custom" | "keep-aspect-ratio-always";
	width?: number;
	height?: number;
};

type ImgWidgetProps = {
	srcUrl: string;
	size?: ImgWidgetSizeSubProp;
};

type Props = ICanvasWidgetProps<ImgWidgetProps>;

let { srcUrl = "", size = { mode: "keep-aspect-ratio-always" } }: Props = $props();

let hasError = $state<boolean>(false);

$effect(() => {
	if (srcUrl) {
		hasError = false;
	}
});
</script>

<!-- ponytail: simplified image widget without edit form and configurations -->
<BaseGlassWidget class="img-widget-wrapper">
  <div class="image-container">
    {#if srcUrl && !hasError}
      <img 
        src={srcUrl} 
        alt="Widget visual" 
        class={[{"keep-aspect-ratio-always": size?.mode}, "no-draggable"]}
        style={size?.mode === 'custom' && size.width && size.height ? `width: ${size.width}px; height: ${size.height}px;` : ''}
        onerror={() => hasError = true}
      />
    {:else}
      <div class="placeholder">
        <div class="placeholder-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
        <span class="placeholder-text {hasError ? 'error' : ''}">
          {hasError ? 'Failed to load image' : 'No image set'}
        </span>
      </div>
    {/if}
  </div>
</BaseGlassWidget>

<style>
  .no-draggable {
    user-select: none;
    -webkit-user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }
  .image-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: auto;
  }
  img {
    display: block;
    max-width: 100%;
    max-height: 100%;
  }
  img.keep-aspect-ratio-always {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  img.custom {
    object-fit: cover;
  }
  .placeholder {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 1.5rem;
    box-sizing: border-box;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
    user-select: none;
    gap: 0.5rem;
  }
  .placeholder-icon {
    color: rgba(255, 255, 255, 0.25);
  }
  .placeholder-text {
    font-size: 0.95rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
  }
  .placeholder-text.error {
    color: #ff5555;
  }
</style>
