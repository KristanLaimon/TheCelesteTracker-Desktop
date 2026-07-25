<script lang="ts">
import BrowserPath from "@core/BrowserPath";
import { NeutralinoFileSystem } from "@core/NeutralinoFileSystem";
import CenteredLayout from "@layouts/CenteredLayout.svelte";
import Canvas from "@libs/Wanvas/Canvas.svelte";
import type { CanvasNodeData, CanvasRegistry } from "@libs/Wanvas/Canvas.types";
import ImgCaptionWidget from "@libs/Wanvas/widgets/ImgCaptionWidget.svelte";
import ImgWidget from "@libs/Wanvas/widgets/ImgWidget.svelte";
import TextWidget from "@libs/Wanvas/widgets/TextWidget.svelte";
import { Log_Info } from "@utils/Logger";

const Path = new BrowserPath();

type Props = {
	localStorageKey: string;
};

const { localStorageKey }: Props = $props();

const registry = {
	textWidget: TextWidget,
	imgWidget: ImgWidget,
	imgCaptionWidget: ImgCaptionWidget,
} satisfies CanvasRegistry;

let defaultNodes = $state<CanvasNodeData<typeof registry>[]>([]);
let canvasX = $state(0);
let canvasY = $state(0);
let canvasZoom = $state(1);

function AddNewTextWidget(text: string) {
	defaultNodes = [
		...defaultNodes,
		{
			id: `node-${Date.now()}`,
			type: "textWidget",
			x: Math.random() * 200,
			y: Math.random() * 200,
			data: { text },
		},
	];
}

function AddNewImgWidget(src: string) {
	defaultNodes = [
		...defaultNodes,
		{
			id: `node-${Date.now()}`,
			type: "imgWidget",
			x: Math.random() * 200,
			y: Math.random() * 200,
			data: { src },
		},
	];
}

function AddNewImgCaptionWidget(src: string, captionText: string) {
	defaultNodes = [
		...defaultNodes,
		{
			id: `node-${Date.now()}`,
			type: "imgCaptionWidget",
			x: Math.random() * 200,
			y: Math.random() * 200,
			data: { src, captionText },
		},
	];
}

function clearNodes() {
	defaultNodes = [];
}

function clearView() {
	canvasX = 0;
	canvasY = 0;
	canvasZoom = 1;
}

function clearAll() {
	defaultNodes = [];
	canvasX = 0;
	canvasY = 0;
	canvasZoom = 1;
}
</script>

<CenteredLayout width="100%" height="100%">
  <div class="hud">
    <button class="hud-btn danger" onclick={clearNodes}>Clear Nodes</button>
    <button class="hud-btn" onclick={clearView}>Reset View</button>
    <button class="hud-btn danger" onclick={clearAll}>Clear All</button>
    <button
      class="hud-btn"
      onclick={() => {
        AddNewTextWidget("default text!!");
      }}>Add new txt widget</button
    >
    <button
      class="hud-btn"
      onclick={() => {
        AddNewImgWidget(
          Path.join(
            NeutralinoFileSystem.ResourcesFolderPath_Frontend,
            "fox.png",
          ),
        );
      }}>Add new img widget</button
    >
    <button
      class="hud-btn"
      onclick={() => {
        AddNewImgCaptionWidget(
          Path.join(
            NeutralinoFileSystem.ResourcesFolderPath_Frontend,
            "fox.png",
          ),
          "### Fox Caption\nThis is a cute fox on the canvas!",
        );
      }}>Add img caption widget</button
    >
  </div>

  <Canvas
    classNames={{ wrapper: "w-full h-full" }}
    mode="normal"
    bind:nodes={defaultNodes}
    bind:x={canvasX}
    bind:y={canvasY}
    bind:zoom={canvasZoom}
    {registry}
    persistence={{
      key: localStorageKey,
      // biome-ignore lint/suspicious/noExplicitAny: Canvas save callbacks
      beforeSave: (nodes: any, _cancel: any) => {
        Log_Info(
          `Canvas with key [${localStorageKey}] is about to save nodes:`,
          nodes,
        );
      },
      // biome-ignore lint/suspicious/noExplicitAny: Canvas save callbacks
      afterSave: (nodes: any) => {
        Log_Info(
          `Canvas with key [${localStorageKey}] saved successfully:`,
          nodes,
        );
      },
    }}
    showDots={true}
  />
</CenteredLayout>

<style>
  /* HUD overlay styling */
  .hud {
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    gap: 8px;
    z-index: 10;
    pointer-events: none;
  }

  .hud-btn {
    background: rgba(30, 30, 32, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    pointer-events: auto;
    transition:
      background 0.15s,
      border-color 0.15s;
  }

  .hud-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .hud-btn.danger:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: #fca5a5;
  }
</style>
