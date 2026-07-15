<script lang="ts">
  import {
    GoldenLayout,
    type LayoutConfig,
    RootItemConfig,
  } from "golden-layout";
  import { onMount } from "svelte";

  onMount(() => {
    const $mainAppMAIN: HTMLElement = document.getElementById("main-app")!;

    var test = new GoldenLayout();
    test.loadLayout({
      settings: {
        hasHeaders: true,
        constrainDragToContainer: true,
        reorderEnabled: true,
        // selectionEnabled: false,
        popoutWholeStack: false,
        blockedPopoutsThrowError: true,
        closePopoutsOnUnload: true,
        showPopoutIcon: true,
        showMaximiseIcon: true,
        showCloseIcon: true,
      },
      dimensions: {
        borderWidth: 5,
        minItemHeight: 10,
        minItemWidth: 10,
        headerHeight: 20,
        dragProxyWidth: 300,
        dragProxyHeight: 200,
      },
      labels: {
        close: "close",
        maximise: "maximise",
        minimise: "minimise",
        popout: "open in new window",
      },
      content: [
        /* see item config */
      ],
      root: RootItemConfig.isRootItemConfig({}),
    });
  });
</script>

<main id="main-app"></main>
