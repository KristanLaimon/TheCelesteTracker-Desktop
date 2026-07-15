<script lang="ts">
import { GoldenLayout, type LayoutConfig, LayoutManager } from 'golden-layout';
import { onMount } from 'svelte';

// Import Golden Layout styles
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';

let layout: GoldenLayout;
let tabCount = 3;

function addTab() {
  if (!layout) return;
  tabCount++;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nextLetter =
    letters[(tabCount - 1) % letters.length] +
    (tabCount > letters.length ? Math.floor((tabCount - 1) / letters.length) : '');

  // Dynamically add a new component tab
  layout.addComponent('testComponent', { label: nextLetter }, `Component ${nextLetter}`);

  // Example of adding a component at a custom location selector (FirstStack)
  layout.addComponentAtLocation('testComponent', { label: 'Y' }, 'CUSTOM LOCATION TITLE', [
    { typeId: LayoutManager.LocationSelector.TypeId.FocusedStack },
  ]);
}

onMount(() => {
  const $mainAppMAIN = document.getElementById('main-app');
  if (!$mainAppMAIN) {
    throw new Error('main not found???');
  }

  // Create GoldenLayout instance using the target container
  layout = new GoldenLayout($mainAppMAIN);

  // Listen for stack creation to inject custom '+' add tab button in header controls
  layout.on('itemCreated', (event) => {
    const item = event.target as any;
    if (item.isStack) {
      const stack = item;

      const addButton = document.createElement('button');
      addButton.textContent = '+';
      addButton.style.marginLeft = '4px';
      addButton.style.marginRight = '4px';
      addButton.style.padding = '2px 6px';
      addButton.style.cursor = 'pointer';
      addButton.style.border = 'none';
      addButton.style.background = '#2563eb';
      addButton.style.color = '#ffffff';
      addButton.style.borderRadius = '4px';
      addButton.style.fontWeight = 'bold';
      addButton.style.fontSize = '12px';
      addButton.title = 'Add new tab to this stack';

      addButton.onclick = () => {
        tabCount++;
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nextLetter =
          letters[(tabCount - 1) % letters.length] +
          (tabCount > letters.length ? Math.floor((tabCount - 1) / letters.length) : '');

        stack.newComponent('testComponent', { label: nextLetter }, `Component ${nextLetter}`);
      };

      setTimeout(() => {
        if (stack.header?.controlsContainerElement) {
          stack.header.controlsContainerElement.appendChild(addButton);
        }
      }, 50);
    }
  });

  // Register component factories
  layout.registerComponentFactoryFunction('testComponent', (container, state) => {
    const el = document.createElement('div');
    el.className = 'p-6 h-full overflow-y-auto text-slate-100 flex flex-col gap-4';
    const label = (state as { label?: string })?.label || '';
    el.innerHTML = `
        <h2 class="text-xl font-bold">Component ${label}</h2>
        <p>This is test component ${label}.</p>
      `;
    container.element.appendChild(el);
  });

  layout.registerComponentFactoryFunction('myCustomComponent', (container, _state) => {
    const el = document.createElement('div');
    el.innerHTML = "<p>My inner 'myCustomComponent' stuff</p>";
    container.element.appendChild(el);
  });

  const config: LayoutConfig = {
    settings: {
      constrainDragToContainer: true,
      reorderEnabled: true,
      popoutWholeStack: false,
      blockedPopoutsThrowError: true,
      closePopoutsOnUnload: true,
    },
    dimensions: {
      borderWidth: 4,
      defaultMinItemHeight: '50px',
      defaultMinItemWidth: '50px',
      headerHeight: 28,
      dragProxyWidth: 300,
      dragProxyHeight: 200,
    },
    header: {
      show: 'top',
      popout: 'Open in new window',
      maximise: 'Maximise',
      close: 'Close',
    },
    root: {
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
    },
  };
  layout.loadLayout(config);

  // Setup ResizeObserver to handle container size changes cleanly
  const resizeObserver = new ResizeObserver(() => {
    if (layout && $mainAppMAIN) {
      layout.setSize($mainAppMAIN.clientWidth, $mainAppMAIN.clientHeight);
    }
  });
  resizeObserver.observe($mainAppMAIN);

  return () => {
    resizeObserver.disconnect();
    layout.destroy();
  };
});
</script>

<div class="layout-wrapper">
  <div>
    <button onclick={addTab}>Add Tab</button>
  </div>
  <div id="main-app"></div>
</div>

<style>
  .layout-wrapper {
    width: 95%;
    height: 95%;
    display: flex;
    flex-direction: column;
  }

  #main-app {
    flex: 1;
    width: 100%;
    height: 100%;
  }
</style>
