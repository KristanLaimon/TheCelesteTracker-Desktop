<script lang="ts">
  import {
    GoldenLayout,
    type RootItemConfig,
  } from "golden-layout";
  import { onMount, mount, unmount, type Component } from "svelte";
  import { Log_Throw } from "../../logic/logger";
  import type { GoldenLayoutThemeCssColorsObject, GoldenLayoutComponentPartsTailwindStylesObject } from "./GoldenLayout.types";

  // PUBLIC-PROPS
  type Props = {
    // 1. Content: Defines the initial structural content (rows, columns, stacks, components) of the layout grid.
    Content: RootItemConfig;

    // 2. components: Maps Svelte component classes to Golden Layout names so they can be mounted inside panels.
    components?: Record<string, Component>;

    // 3. layout: Binds the underlying Golden Layout instance back to the parent for programmatic control.
    layout?: GoldenLayout | null;

    // 4. componentParts: Custom Tailwind CSS classes to style layout sections (header, tab, splitter, content, etc.).
    componentParts?: GoldenLayoutComponentPartsTailwindStylesObject;

    // 5. theme: Dynamic color mapping using CSS custom variables supporting hex/rgba color strings.
    theme?: GoldenLayoutThemeCssColorsObject;
  };

  let {
    Content,
    components = {},
    layout = $bindable(null),
    componentParts = {},
    theme = {},
  }: Props = $props();

  // Satisfy TypeScript unused variable check
  void layout;

  // INTERNAL VARIABLES
  let layoutContainerEl: HTMLDivElement;
  let LAYOUT: GoldenLayout | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;

  // DERIVED VALUES
  const hasTheme = $derived(theme && Object.keys(theme).length > 0);
  const cssVariables = $derived(
    Object.entries(theme)
      .filter(([_, val]) => val)
      .map(([key, val]) => `--gl-${key}:${val}`)
      .join(";")
  );

  // ponytail: simplified class applier using standard DOM dataset caching
  function applyTailwindClasses(root: HTMLElement) {
    if (!componentParts || Object.keys(componentParts).length === 0) return;

    mutationObserver?.disconnect();

    const selectors: Record<string, string> = {
      layout: ".lm_goldenlayout",
      content: ".lm_content",
      header: ".lm_header",
      splitter: ".lm_splitter",
      dragProxy: ".lm_dragProxy",
    };

    for (const [part, selector] of Object.entries(selectors)) {
      const classes = componentParts[part as keyof typeof componentParts];
      if (!classes) continue;

      root.querySelectorAll(selector).forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl.dataset.originalClass) {
          htmlEl.dataset.originalClass = htmlEl.className;
        }
        htmlEl.className = `${htmlEl.dataset.originalClass} ${classes}`;
      });
    }

    root.querySelectorAll(".lm_tab").forEach((el) => {
      const tabEl = el as HTMLElement;
      const isAct = tabEl.classList.contains("lm_active");
      const add = (isAct ? componentParts.activeTab : componentParts.tab) || "";
      const remove = (isAct ? componentParts.tab : componentParts.activeTab) || "";

      if (remove) remove.split(/\s+/).forEach((c) => c && tabEl.classList.remove(c));
      if (add) add.split(/\s+/).forEach((c) => c && tabEl.classList.add(c));
    });

    if (mutationObserver && layoutContainerEl) {
      mutationObserver.observe(layoutContainerEl, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    }
  }

  // LIFECYCLE
  onMount(() => {
    if (!layoutContainerEl) {
      Log_Throw("Layout HTML element not found to inject Golden-Layout dependency.");
      return;
    }

    LAYOUT = new GoldenLayout(layoutContainerEl);
    layout = LAYOUT;

    if (components) {
      for (const [name, component] of Object.entries(components)) {
        LAYOUT.registerComponentFactoryFunction(name, (container, state) => {
          const componentInstance = mount(component, {
            target: container.element,
          // biome-ignore lint/suspicious/noExplicitAny: A prop can be literally anything. Exception case.
            props: (state as Record<string, any>) || {},
          });

          container.on("destroy", () => {
            unmount(componentInstance);
          });
        });
      }
    }

    // ponytail: load layout config directly with optimal default settings
    LAYOUT.loadLayout({
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
    });

    // ponytail: only observe DOM changes if Tailwind classes (componentParts) are specified
    if (componentParts && Object.keys(componentParts).length > 0) {
      applyTailwindClasses(layoutContainerEl);

      mutationObserver = new MutationObserver((mutations) => {
        const shouldSync = mutations.some((m) => 
          m.addedNodes.length > 0 || 
          (m.type === "attributes" && m.target instanceof HTMLElement && 
           ["lm_goldenlayout", "lm_content", "lm_header", "lm_splitter", "lm_dragProxy", "lm_tab"].some(cls => (m.target as HTMLElement).classList.contains(cls)))
        );

        if (shouldSync && layoutContainerEl) {
          applyTailwindClasses(layoutContainerEl);
        }
      });

      mutationObserver.observe(layoutContainerEl, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    resizeObserver = new ResizeObserver(() => {
      if (LAYOUT && layoutContainerEl) {
        LAYOUT.setSize(layoutContainerEl.clientWidth, layoutContainerEl.clientHeight);
      }
    });
    resizeObserver.observe(layoutContainerEl);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      if (LAYOUT) LAYOUT.destroy();
      layout = null;
    };
  });
</script>

<div
  class="container-wrapper"
  class:has-custom-theme={hasTheme}
  style="{cssVariables}"
>
  <div id="the-layout" bind:this={layoutContainerEl}></div>
</div>

<style>
  /* ponytail: container fills 100% of parent by default, letting parent style container size */
  .container-wrapper {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  #the-layout {
    width: 100%;
    height: 100%;
  }

  .container-wrapper.has-custom-theme :global(.lm_goldenlayout) {
    background: var(--gl-layoutBg) !important;
  }

  .container-wrapper.has-custom-theme :global(.lm_content) {
    background: var(--gl-contentBg) !important;
    border: var(--gl-contentBorder) !important;
  }

  .container-wrapper.has-custom-theme :global(.lm_splitter) {
    background: var(--gl-splitterBg) !important;
  }

  .container-wrapper.has-custom-theme :global(.lm_splitter:hover),
  .container-wrapper.has-custom-theme :global(.lm_splitter.lm_dragging) {
    background: var(--gl-splitterHoverBg) !important;
    opacity: 1 !important;
  }

  .container-wrapper.has-custom-theme :global(.lm_header) {
    background: var(--gl-headerBg) !important;
  }

  .container-wrapper.has-custom-theme :global(.lm_tab) {
    background: var(--gl-tabBg) !important;
    color: var(--gl-tabText) !important;
  }

  .container-wrapper.has-custom-theme :global(.lm_tab:hover) {
    background: var(--gl-tabHoverBg) !important;
    color: var(--gl-tabHoverText) !important;
  }

  .container-wrapper.has-custom-theme :global(.lm_tab.lm_active) {
    background: var(--gl-activeTabBg) !important;
    color: var(--gl-activeTabText) !important;
  }

  .container-wrapper.has-custom-theme :global(.lm_dragProxy) {
    background: var(--gl-dragProxyBg) !important;
    border: var(--gl-dragProxyBorder) !important;
  }
</style>
