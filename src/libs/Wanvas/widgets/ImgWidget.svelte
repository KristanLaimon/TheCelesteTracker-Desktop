<script lang="ts">
import type { ICanvasWidgetProps } from '../Canvas.types';

type ImgWidgetSizeSubProp = {
	mode: 'custom' | 'keep-aspect-ratio-always';
	width?: number;
	height?: number;
};

type ImgWidgetProps = {
	srcUrl: string;
	size?: ImgWidgetSizeSubProp;
};

type Props = ICanvasWidgetProps<ImgWidgetProps>;

let { srcUrl = $bindable(''), size = $bindable({ mode: 'keep-aspect-ratio-always', width: 300, height: 200 }), onChange }: Props = $props();

let isEditing = $state<boolean>(false);
let hasError = $state<boolean>(false);

$effect(() => {
	// Re-check image error state if srcUrl changes
	if (srcUrl) {
		hasError = false;
	}
});

function handleImageError() {
	hasError = true;
}
</script>

<article 
  class="img-widget-wrapper" 
  class:editing={isEditing}
  ondblclick={() => { if (!isEditing) isEditing = true; }}
>
  {#if isEditing}
    <div class="edit-form interactive" role="presentation" onmousedown={(e) => e.stopPropagation()}>
      <h3>Configure Image</h3>
      
      <div class="input-group">
        <label for="img-url-input">Image Source URL or Local Path</label>
        <input
          id="img-url-input"
          type="text"
          value={srcUrl}
          placeholder="https://example.com/image.png or local path..."
          oninput={(e) => {
            const val = e.currentTarget.value;
            srcUrl = val;
            onChange?.({ srcUrl: val });
          }}
        />
      </div>

      <div class="input-group">
        <label for="img-size-mode">Size Mode</label>
        <select 
          id="img-size-mode" 
          value={size.mode}
          onchange={(e) => {
            const val = e.currentTarget.value as 'keep-aspect-ratio-always' | 'custom';
            const newSize = {
              mode: val,
              width: size.width ?? 300,
              height: size.height ?? 200
            };
            size = newSize;
            onChange?.({ size: newSize });
          }}
        >
          <option value="keep-aspect-ratio-always">Keep Aspect Ratio (Contain)</option>
          <option value="custom">Custom Dimensions</option>
        </select>
      </div>

      {#if size.mode === 'custom'}
        <div class="dimensions-group">
          <div class="dim-input">
            <label for="img-width">Width (px)</label>
            <input
              id="img-width"
              type="number"
              value={size.width}
              min="10"
              max="2000"
              oninput={(e) => {
                const val = Number(e.currentTarget.value);
                const newSize = { ...size, width: val };
                size = newSize;
                onChange?.({ size: newSize });
              }}
            />
          </div>
          <div class="dim-input">
            <label for="img-height">Height (px)</label>
            <input
              id="img-height"
              type="number"
              value={size.height}
              min="10"
              max="2000"
              oninput={(e) => {
                const val = Number(e.currentTarget.value);
                const newSize = { ...size, height: val };
                size = newSize;
                onChange?.({ size: newSize });
              }}
            />
          </div>
        </div>
      {/if}

      <div class="actions">
        <button type="button" class="btn btn-save" onclick={() => isEditing = false}>Done</button>
      </div>
    </div>
  {:else}
    <div class="image-container">
      {#if srcUrl && !hasError}
        <img 
          src={srcUrl} 
          alt="Widget visual" 
          class={size?.mode ?? 'keep-aspect-ratio-always'}
          style={size?.mode === 'custom' ? `width: ${size.width}px; height: ${size.height}px;` : ''}
          onerror={handleImageError}
        />
        <div class="hover-overlay">
          <button 
            type="button"
            class="edit-btn interactive" 
            onclick={() => isEditing = true}
            title="Edit Image URL & Size"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>
      {:else}
        <button type="button" class="placeholder" onclick={() => isEditing = true}>
          <div class="placeholder-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          {#if hasError}
            <span class="placeholder-text error">Failed to load image</span>
          {:else}
            <span class="placeholder-text">Click to set image</span>
          {/if}
          <span class="placeholder-subtext">Double click to configure</span>
        </button>
      {/if}
    </div>
  {/if}
</article>

<style>
  .img-widget-wrapper {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: rgba(30, 30, 35, 0.7);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    position: relative;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .img-widget-wrapper:hover {
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
  }
  .img-widget-wrapper.editing {
    border-color: rgba(189, 147, 249, 0.4);
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
  .hover-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    opacity: 0;
    transition: opacity 0.2s ease;
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    padding: 0.5rem;
    pointer-events: none;
  }
  .image-container:hover .hover-overlay {
    opacity: 1;
  }
  .edit-btn {
    pointer-events: auto;
    background: rgba(30, 30, 35, 0.85);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #f8f8f2;
    padding: 0.4rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.2s ease, transform 0.1s ease, border-color 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }
  .edit-btn:hover {
    background: rgba(189, 147, 249, 0.9);
    border-color: rgba(189, 147, 249, 0.2);
    color: #1e1e24;
    transform: scale(1.05);
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
    cursor: pointer;
    color: #8be9fd;
    text-align: center;
    user-select: none;
    gap: 0.5rem;
    transition: background-color 0.2s ease;
    background: transparent;
    border: none;
    font-family: inherit;
    outline: none;
  }
  .placeholder:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  .placeholder-icon {
    color: rgba(255, 255, 255, 0.35);
    transition: transform 0.2s ease, color 0.2s ease;
  }
  .placeholder:hover .placeholder-icon {
    transform: scale(1.1);
    color: #ff79c6;
  }
  .placeholder-text {
    font-size: 0.95rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
  }
  .placeholder-text.error {
    color: #ff5555;
  }
  .placeholder-subtext {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
  .edit-form {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 1rem;
    box-sizing: border-box;
    justify-content: flex-start;
    gap: 0.65rem;
    overflow-y: auto;
  }
  h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #f8f8f2;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 0.3rem;
  }
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .dimensions-group {
    display: flex;
    gap: 0.5rem;
  }
  .dim-input {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
  }
  label {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.5);
  }
  input, select {
    width: 100%;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 0.45rem;
    box-sizing: border-box;
    color: #f8f8f2;
    font-family: inherit;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  select option {
    background: #1e1e24;
    color: #f8f8f2;
  }
  input:focus, select:focus {
    border-color: #bd93f9;
    box-shadow: 0 0 0 2px rgba(189, 147, 249, 0.2);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.4rem;
  }
  .btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    outline: none;
    transition: background-color 0.2s ease, transform 0.1s ease;
  }
  .btn-save {
    background: #bd93f9;
    border: none;
    color: #1e1e24;
  }
  .btn-save:hover {
    background: #a370f7;
    transform: scale(1.02);
  }
</style>
