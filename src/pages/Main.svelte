<script lang="ts">
import CustomPanel from '../components/CustomPanel.svelte';
import RawHtml from '../libs/GoldenLayoutThemes/components/RawHtml.svelte';
import GoldenLayout from '../libs/GoldenLayoutThemes/GoldenLayout.svelte';
import type { CustomRootContentItemsConfig, LayoutContentRootConfig } from '../libs/GoldenLayoutThemes/GoldenLayout.types';

const Layout_InitialComponents = {
	testComponent: RawHtml,
	myCustomComponent: CustomPanel,
} satisfies LayoutContentRootConfig;

const Layout_InitialContent: CustomRootContentItemsConfig<typeof Layout_InitialComponents> = {
	type: 'row',
	content: [
		{
			type: 'row',
			content: [
				{
					type: 'component',
					componentType: 'myCustomComponent',
					componentState: { label: 'A' },
					isClosable: false,
					maximised: false,
				},
				{
					type: 'column',
					content: [
						{
							type: 'component',
							componentType: 'testComponent',
							componentState: { label: 'B' },
						},
						{
							type: 'component',
							componentType: 'testComponent',
							componentState: { label: 'C' },
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
      components={Layout_InitialComponents}
      defaultComponent={RawHtml}
      overrideStyles={{activeTab:{alignItems: "left"}}}
      // componentParts={{
      //   header: 'bg-slate-900 border-b border-slate-700/50',
      //   tab: 'bg-slate-800 text-slate-400 hover:bg-slate-700/80 transition-colors',
      //   activeTab: 'bg-slate-750 text-blue-400 font-semibold border-t-2 border-blue-500',
      //   content: 'bg-slate-950 text-slate-200 border border-slate-800',
      //   splitter: 'bg-slate-900 hover:bg-blue-600/80 transition-colors duration-200',
      // }}
      // theme={{
      //   layoutBg: '#0f172a',      // Slate-900
      //   splitterBg: '#1e293b',    // Slate-800
      //   splitterHoverBg: '#3b82f6', // Blue-500
      // }}
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
