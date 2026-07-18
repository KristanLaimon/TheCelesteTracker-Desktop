<script lang="ts">
import type { ComponentProps } from 'svelte';
import Canvas from '../libs/GoldenLayoutThemes/components/GL_Canvas.svelte';
import RawHtml from '../libs/GoldenLayoutThemes/components/GL_RawHtml.svelte';
import GoldenLayout from '../libs/GoldenLayoutThemes/GoldenLayout.svelte';
import type { GoldenLayoutContent } from '../libs/GoldenLayoutThemes/GoldenLayout.types';

const Layout_InitialContent: GoldenLayoutContent = {
	type: 'row',
	content: [
		{
			type: 'row',
			content: [
				{
					type: 'stack',
					content: [
						{
							type: 'component',
							componentSvelte: Canvas,
							componentProps: { localStorageKey: 'canvas-1' } satisfies ComponentProps<typeof Canvas>,
						},
						{
							type: 'component',
							componentSvelte: RawHtml,
							componentProps: { htmlContent: 'Hola, raw HTML 2' } satisfies ComponentProps<typeof RawHtml>,
						},
					],
				},
				{
					type: 'column',
					content: [
						{
							type: 'component',
							componentSvelte: RawHtml,
							componentProps: {},
						},
						{
							type: 'component',
							componentSvelte: RawHtml,
							componentProps: { htmlContent: 'Hola, raw HTML 3' } satisfies ComponentProps<typeof RawHtml>,
						},
						{
							type: 'component',
							componentSvelte: Canvas,
							componentProps: { localStorageKey: 'canvas-2' } satisfies ComponentProps<typeof Canvas>,
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
