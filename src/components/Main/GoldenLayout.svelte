<script lang="ts">
  import {
    GoldenLayout,
    Stack,
    type RootItemConfig,
  } from "golden-layout";
  import { onMount, mount, unmount, type Component } from "svelte";
  import { Log_Throw } from "../../logic/logger";
  import { GoldenLayoutWrapper } from "./GoldenLayoutWrapper";
  import type {
    GoldenLayoutThemeCssColorsStyles,
    GoldenLayoutComponentPartsTailwindStyles,
  } from "./GoldenLayout.types";

  // PUBLIC-PROPS
  type Props = {
    // 1. Content: Defines the initial structural content of the layout grid.
    Content: RootItemConfig;

    // 2. components: Maps Svelte component classes to Golden Layout names.
    components?: Record<string, Component<Record<string, unknown>>>;

    // 3. layout: Binds the custom Golden Layout Wrapper instance back to the parent.
    layout?: GoldenLayoutWrapper | null;

    // 4. componentParts: Custom Tailwind CSS classes to style layout sections.
    customLayoutTailwindStyles?: GoldenLayoutComponentPartsTailwindStyles;

    // 5. theme: Dynamic color mapping using CSS custom variables.
    theme?: GoldenLayoutThemeCssColorsStyles;

    // 6. defaultComponent: Mandatory Svelte component class to render on new "+" tabs.
    defaultComponent: Component<Record<string, unknown>>;
  };

  let {
    Content,
    components = {},
    layout = $bindable(null),
    customLayoutTailwindStyles: componentParts = {},
    theme = {},
    defaultComponent,
  }: Props = $props();

  // Satisfy TypeScript unused variable check
  void layout;

  // INTERNAL VARIABLES
  let layoutContainerEl: HTMLDivElement;
  let LAYOUT: GoldenLayout | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;

  // WeakMap to associate HTML header elements to their Stack instances cleanly
  const headerStackMap = new WeakMap<HTMLElement, Stack>();

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

      if (remove) remove.split(/\s+/).forEach((c: string) => c && tabEl.classList.remove(c));
      if (add) add.split(/\s+/).forEach((c: string) => c && tabEl.classList.add(c));
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

  // ponytail: appends a custom "+" button next to the tabs in the header
  function appendPlusButton(stack: Stack) {
    const tabsContainer = stack.header.tabsContainerElement;
    if (!tabsContainer) return;

    if (!tabsContainer.querySelector(".gl-add-tab-btn")) {
      const btn = document.createElement("button");
      btn.textContent = "+";
      btn.className = "gl-add-tab-btn lm_tab";
      btn.style.cursor = "pointer";
      btn.style.padding = "0 10px";
      btn.style.fontWeight = "bold";
      btn.style.border = "none";
      btn.style.height = "100%";
      btn.style.display = "inline-flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.title = "Add new tab";

      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        stack.newComponent("__defaultComponent", {}, "New Tab");
      };

      tabsContainer.appendChild(btn);

      if (componentParts && Object.keys(componentParts).length > 0) {
        applyTailwindClasses(layoutContainerEl);
      }
    }
  }

  // LIFECYCLE
  onMount(() => {
    if (!layoutContainerEl) {
      Log_Throw("Layout HTML element not found to inject Golden-Layout dependency.");
      return;
    }

    LAYOUT = new GoldenLayout(layoutContainerEl);
    layout = new GoldenLayoutWrapper(LAYOUT);

    // Register Svelte components
    if (components) {
      for (const [name, component] of Object.entries(components)) {
        LAYOUT.registerComponentFactoryFunction(name, (container, state) => {
          const componentInstance = mount(component, {
            target: container.element,
            props: (state as Record<string, unknown>) || {},
          });

          container.on("destroy", () => {
            unmount(componentInstance);
          });
        });
      }
    }

    // Register the mandatory default Svelte component
    LAYOUT.registerComponentFactoryFunction("__defaultComponent", (container, state) => {
      const componentInstance = mount(defaultComponent, {
        target: container.element,
        props: (state as Record<string, unknown>) || {},
      });

      container.on("destroy", () => {
        unmount(componentInstance);
      });
    });

    // Bind event to track and store stack references on headers for self-healing "+" button
    LAYOUT.on("itemCreated", (event) => {
      const item = event.target;
      if (item instanceof Stack) {
        setTimeout(() => {
          if (item.header.element) {
            headerStackMap.set(item.header.element, item);
            appendPlusButton(item);
          }
        }, 50);
      }
    });

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

    if (componentParts && Object.keys(componentParts).length > 0) {
      applyTailwindClasses(layoutContainerEl);
    }

    // ponytail: simplified observer to detect layout changes and ensure self-healing "+" button
    mutationObserver = new MutationObserver((mutations) => {
      // Re-apply classes if layout DOM changes
      if (componentParts && Object.keys(componentParts).length > 0) {
        const shouldSync = mutations.some((m) => 
          m.addedNodes.length > 0 || 
          (m.type === "attributes" && m.target instanceof HTMLElement && 
           ["lm_goldenlayout", "lm_content", "lm_header", "lm_splitter", "lm_dragProxy", "lm_tab"].some(cls => (m.target as HTMLElement).classList.contains(cls)))
        );

        if (shouldSync && layoutContainerEl) {
          applyTailwindClasses(layoutContainerEl);
        }
      }

      // Check and restore "+" buttons if they were removed during layout updates
      layoutContainerEl.querySelectorAll(".lm_header").forEach((headerEl) => {
        if (headerEl instanceof HTMLElement) {
          const stack = headerStackMap.get(headerEl);
          if (stack) {
            appendPlusButton(stack);
          }
        }
      });
    });

    mutationObserver.observe(layoutContainerEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

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
