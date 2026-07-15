<script lang="ts">
import { LayoutManager, type RootItemConfig } from 'golden-layout';
import GoldenLayout from '../components/Main/GoldenLayout.svelte';
import TestPanel from './TestPanel.svelte';
import CustomPanel from './CustomPanel.svelte';

// Import Golden Layout styles
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';

let layout = $state<any>(null);
let tabCount = 3;

function addTab() {
  if (!layout) return;
  tabCount++;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nextLetter =
    letters[(tabCount - 1) % letters.length] + (tabCount > letters.length ? Math.floor((tabCount - 1) / letters.length) : '');

  // Dynamically add a new component tab
  layout.addComponent('testComponent', { label: nextLetter }, `Component ${nextLetter}`);

  // Example of adding a component at a custom location selector (FocusedStack)
  layout.addComponentAtLocation('testComponent', { label: 'Y' }, 'CUSTOM LOCATION TITLE', [
    { typeId: LayoutManager.LocationSelector.TypeId.FocusedStack },
  ]);
}

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
  <div class="pb-2">
    <button onclick={addTab} class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors border-none cursor-pointer">
      Add Tab
    </button>
  </div>
  
  <div class="layout-container">
    <!-- Simple, clean usage of GoldenLayout wrapper component -->
    <GoldenLayout
      bind:layout
      {Content}
      components={{
        testComponent: TestPanel,
        myCustomComponent: CustomPanel,
      }}
      componentParts={{
        header: 'bg-slate-900 border-b border-slate-700/50',
        tab: 'bg-slate-800 text-slate-400 hover:bg-slate-700/80 transition-colors',
        activeTab: 'bg-slate-750 text-blue-400 font-semibold border-t-2 border-blue-500',
        content: 'bg-slate-950 text-slate-200 border border-slate-800',
        splitter: 'bg-slate-900 hover:bg-blue-600/80 transition-colors duration-200',
      }}
      theme={{
        layoutBg: '#0f172a',      // Slate-900
        splitterBg: '#1e293b',    // Slate-800
        splitterHoverBg: '#3b82f6', // Blue-500
      }}
    />
  </div>
</div>

<style>
  .layout-wrapper {
    width: 95%;
    height: 95%;
    display: flex;
    flex-direction: column;
  }

  .layout-container {
    flex: 1;
    width: 100%;
    height: 100%;
  }
</style>
