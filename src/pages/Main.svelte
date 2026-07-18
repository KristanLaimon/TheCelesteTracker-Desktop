<script lang="ts">
import RawHtml from '../libs/GoldenLayoutThemes/components/RawHtml.svelte';
import GoldenLayout from '../libs/GoldenLayoutThemes/GoldenLayout.svelte';
import type { GoldenLayoutContent } from '../libs/GoldenLayoutThemes/GoldenLayout.types';

const Layout_InitialContent: GoldenLayoutContent = {
	type: 'row',
	content: [
		{
			type: 'row',
			content: [
				{
					type: 'component',
					componentSvelte: RawHtml,
					componentProps: { htmlContent: 'Hola, raw HTML' },
					isClosable: false,
					maximised: false,
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
