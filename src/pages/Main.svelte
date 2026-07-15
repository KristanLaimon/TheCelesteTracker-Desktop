<script lang="ts">
import { type RootItemConfig } from 'golden-layout';
import GoldenLayout from '../components/Main/GoldenLayout.svelte';
import { GoldenLayoutWrapper } from '../components/Main/GoldenLayoutWrapper';
import CustomPanel from './CustomPanel.svelte';
import TestPanel from './TestPanel.svelte';

// import 'golden-layout/dist/css/goldenlayout-base.css';
// import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';

let layout = $state<GoldenLayoutWrapper | null>(null);

const Content: RootItemConfig = {
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

<div class="layout-wrapper">
  <GoldenLayout
    bind:layout
    {Content}
    components={{
      testComponent: TestPanel,
      myCustomComponent: CustomPanel,
    }}
    defaultComponent={TestPanel}
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

<style>
  .layout-wrapper {
    width: 95vw;
    height: 95vh;
  }
</style>
