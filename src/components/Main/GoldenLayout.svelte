<script lang="ts">
  import {
    GoldenLayout,
    type LayoutConfig,
    type RootItemConfig,
  } from "golden-layout";
  import { onMount } from "svelte";
  import { Log_Throw } from "../../logic/logger";

  // PUBLIC-PROPS
  type Props = {
    LayoutConfigOverride?: Omit<LayoutConfig, "root">; //Root is being handled by Content Prop.
    Content: RootItemConfig;
  };
  const { Content, LayoutConfigOverride = {} } = $props() as Props;

  // INTERNAL-PROPS
  let LAYOUT: GoldenLayout;
  let LAYOUT_CONFIG: LayoutConfig = $derived.by(() => {
    return {
      settings: {
        constrainDragToContainer: true,
        reorderEnabled: true,
        popoutWholeStack: false,
        blockedPopoutsThrowError: true,
        closePopoutsOnUnload: true,
      },
      dimensions: {
        borderWidth: 4,
        defaultMinItemHeight: "50px",
        defaultMinItemWidth: "50px",
        headerHeight: 28,
        dragProxyWidth: 300,
        dragProxyHeight: 200,
      },
      header: {
        show: "top",
        popout: "Open in new window",
        maximise: "Maximise",
        close: "Close",
      },
      root: Content,
      ...LayoutConfigOverride,
    } satisfies LayoutConfig;
  });

  // LIFECYCLE
  onMount(() => {
    const HTML_layoutElement = document.getElementById(
      "the-layout",
    ) as HTMLDivElement | null;
    if (!HTML_layoutElement) {
      Log_Throw(
        "#the-layout HTML element no found to inject Golden-Layout dependency....",
      );
      return;
    }
    LAYOUT = new GoldenLayout(HTML_layoutElement);
    LAYOUT.loadLayout(LAYOUT_CONFIG);
    //Here LAYOUT automatically injects itself and starts. No *.init() or *.start() needed.
  });
</script>

<div class="container-wrapper">
  <div id="the-layout"></div>
</div>

<style>
</style>
