<script lang="ts">
import Canvas from '../libs/GoldenLayoutThemes/components/GL_Canvas.svelte';
import RawHtml from '../libs/GoldenLayoutThemes/components/GL_RawHtml.svelte';
import GoldenLayout from '../libs/GoldenLayoutThemes/GoldenLayout.svelte';
import type { GoldenLayoutContent, GoldenLayoutRegistry } from '../libs/GoldenLayoutThemes/GoldenLayout.types';

const registry = {
	canvas: Canvas,
	rawHtml: RawHtml,
} satisfies GoldenLayoutRegistry;

const Layout_InitialContent: GoldenLayoutContent<typeof registry> = {
	type: 'row',
	content: [
		{
			type: 'row',
			content: [
				{
					type: 'stack',
					content: [
						{
							type: 'canvas',
							props: { localStorageKey: 'canvas-1' },
						},
						{
							type: 'rawHtml',
							props: { htmlContent: 'Hola, raw HTML 2' },
						},
					],
          width: "60%"
				},
				{
					type: 'column',
					content: [
						{
							type: 'rawHtml',
							props: { htmlContent: 'Hola, default raw HTML' },
						},
						{
							type: 'rawHtml',
							props: { htmlContent: 'Hola, raw HTML 3' },
						},
						{
							type: 'canvas',
							props: { localStorageKey: 'canvas-2' },
						},
					],
				},
			],
		},
	],
};
</script>

<main id="root-app">
  <div class="layout-wrapper">
    <GoldenLayout
      content={Layout_InitialContent}
      components={registry}
      defaultComponent={RawHtml}
    />
  </div>
</main>

<style>
  #root-app {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .layout-wrapper {
    width: 95%;
    height: 95%;
  }

  :global(body) {
    overflow: hidden;
  }
</style>
