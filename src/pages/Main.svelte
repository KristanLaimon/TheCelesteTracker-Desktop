<script lang="ts">
import RawHtml from '../libs/GoldenLayoutThemes/components/RawHtml.svelte';
import GoldenLayout from '../libs/GoldenLayoutThemes/GoldenLayout.svelte';
import type { GoldenLayoutContent } from '../libs/GoldenLayoutThemes/GoldenLayout.types';
import Canvas from '../libs/Wanvas/Canvas.svelte';
import type { CanvasProps } from '../libs/Wanvas/Canvas.types';

const Layout_InitialContent: GoldenLayoutContent = {
	type: 'row',
	content: [
		{
			type: 'row',
			content: [
				// {
				// 	type: 'component',
				// 	componentSvelte: RawHtml,
				// 	componentProps: { htmlContent: 'Hola, raw HTML' },
				// 	isClosable: false,
				// 	maximised: false,
				//   title: "My First tab!"
				// },
				{
					type: 'stack',
					content: [
						{
							type: 'component',
							componentSvelte: Canvas,
							componentProps: {} satisfies CanvasProps,
						},
					],
				},
				{
					type: 'column',
					content: [
						{
							type: 'component',
							componentSvelte: RawHtml,
							componentProps: { htmlContent: 'Hola, raw HTML 2' },
						},
						{
							type: 'component',
							componentSvelte: RawHtml,
							componentProps: { htmlContent: 'Hola, raw HTML 3' },
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
