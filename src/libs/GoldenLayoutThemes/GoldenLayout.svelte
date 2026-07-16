<script lang="ts" generics="ComponentTypes extends LayoutContentRootConfig & string">
import { GoldenLayout, Stack } from 'golden-layout';
import { type Component, mount, onMount, unmount } from 'svelte';
import type {
	CustomRootContentItemsConfig,
	GoldenLayoutComponentPartsTailwindCssOverrides,
	GoldenLayoutThemeCssColorsOverrides,
	LayoutContentRootConfig,
} from './GoldenLayout.types';
import { GoldenLayoutWrapper } from './GoldenLayoutWrapper';

import './goldenlayout-base.css';
import './predefined/goldenlayout-dark-theme.css';
import { Log_Info } from '../Logger';

// PUBLIC-PROPS
type Props = {
	// 1. Content: Defines the initial structural content of the layout grid.
	content: CustomRootContentItemsConfig<ComponentTypes>;

	// 2. components: Maps Svelte component classes to Golden Layout names.
	// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
	components?: Record<ComponentTypes, Component<any, any, any>>;

	// 3. layout: Binds the custom Golden Layout Wrapper instance back to the parent.
	layout?: GoldenLayoutWrapper | null;

	// 4. componentParts: Custom Tailwind CSS classes to style layout sections.
	componentParts?: GoldenLayoutComponentPartsTailwindCssOverrides;

	// 5. theme: Dynamic color mapping using CSS custom variables.
	theme?: GoldenLayoutThemeCssColorsOverrides;

	// 6. defaultComponent: Mandatory Svelte component class to render on new "+" tabs.
	// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
	defaultComponent: Component<any, any, any>;

	// 7. class: Optional CSS class names to apply to the root wrapper element.
	class?: string;
};

let {
	content: Content,
	// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
	components = {} as Record<ComponentTypes, Component<any, any, any>>,
	layout = $bindable(null),
	componentParts = {},
	theme = {},
	defaultComponent,
	class: className = '',
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
		.join(';'),
);

// ponytail: simplified class applier using standard DOM dataset caching
function applyTailwindClasses(root: HTMLElement) {
	if (!componentParts || Object.keys(componentParts).length === 0) return;

	mutationObserver?.disconnect();

	const selectors: Record<string, string> = {
		layout: '.lm_goldenlayout',
		content: '.lm_content',
		header: '.lm_header',
		splitter: '.lm_splitter',
		dragProxy: '.lm_dragProxy',
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

	root.querySelectorAll('.lm_tab').forEach((el) => {
		const tabEl = el as HTMLElement;
		const isAct = tabEl.classList.contains('lm_active');
		const add = (isAct ? componentParts.activeTab : componentParts.tab) || '';
		const remove = (isAct ? componentParts.tab : componentParts.activeTab) || '';

		if (remove) remove.split(/\s+/).forEach((c: string) => c && tabEl.classList.remove(c));
		if (add) add.split(/\s+/).forEach((c: string) => c && tabEl.classList.add(c));
	});

	if (mutationObserver && layoutContainerEl) {
		mutationObserver.observe(layoutContainerEl, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['class'],
		});
	}
}

// ponytail: appends a custom "+" button next to the tabs in the header
function appendPlusButton(stack: Stack) {
	if (!stack.header) return;
	const tabsContainer = stack.header.tabsContainerElement;
	if (!tabsContainer) return;

	if (!tabsContainer.querySelector('.gl-add-tab-btn')) {
		const btn = document.createElement('button');
		btn.textContent = '+';
		btn.className = 'gl-add-tab-btn lm_tab';
		btn.style.cursor = 'pointer';
		btn.style.padding = '0 10px';
		btn.style.fontWeight = 'bold';
		btn.style.border = 'none';
		btn.style.height = '100%';
		btn.style.display = 'inline-flex';
		btn.style.alignItems = 'center';
		btn.style.justifyContent = 'center';
		btn.title = 'Add new tab';

		btn.onclick = (e) => {
			e.preventDefault();
			e.stopPropagation();
			stack.newComponent('__defaultComponent', {}, 'New Tab');
		};

		tabsContainer.appendChild(btn);

		if (componentParts && Object.keys(componentParts).length > 0) {
			applyTailwindClasses(layoutContainerEl);
		}
	}
}

// LIFECYCLE
onMount(() => {
	try {
		Log_Info('GoldenLayout Wrapper: Mounting Svelte Component...');

		if (!layoutContainerEl) {
			console.error('Layout HTML element not found to inject Golden-Layout dependency.');
			return;
		}

		Log_Info('GoldenLayout Wrapper: Initializing raw GoldenLayout...');
		LAYOUT = new GoldenLayout(layoutContainerEl);
		layout = new GoldenLayoutWrapper(LAYOUT);

		// Register Svelte components
		if (components) {
			// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
			for (const [name, component] of Object.entries(components) as [string, Component<any, any, any>][]) {
				Log_Info(`GoldenLayout Wrapper: Registering component "${name}"`);
				LAYOUT.registerComponentFactoryFunction(name, (container, state) => {
					try {
						Log_Info(`GoldenLayout Wrapper: Factory function called for "${name}"`);
						const componentInstance = mount(component, {
							target: container.element,
							props: (state as Record<string, unknown>) || {},
						});

						container.on('destroy', () => {
							unmount(componentInstance);
						});
					} catch (err) {
						console.error(`GoldenLayout Wrapper: Error mounting component "${name}":`, err);
					}
				});
			}
		}

		// Register the mandatory default Svelte component
		Log_Info('GoldenLayout Wrapper: Registering default component');
		LAYOUT.registerComponentFactoryFunction('__defaultComponent', (container, state) => {
			try {
				Log_Info('GoldenLayout Wrapper: Factory function called for defaultComponent');
				const componentInstance = mount(defaultComponent, {
					target: container.element,
					props: (state as Record<string, unknown>) || {},
				});

				container.on('destroy', () => {
					unmount(componentInstance);
				});
			} catch (err) {
				console.error('GoldenLayout Wrapper: Error mounting defaultComponent:', err);
			}
		});

		// Bind event to track and store stack references on headers for self-healing "+" button
		LAYOUT.on('itemCreated', (event) => {
			const item = event.target;
			if (item instanceof Stack) {
				setTimeout(() => {
					try {
						if (item.header?.element) {
							headerStackMap.set(item.header.element, item);
							appendPlusButton(item);
						}
					} catch (err) {
						console.error('GoldenLayout Wrapper: Error in stack itemCreated handler:', err);
					}
				}, 50);
			}
		});

		Log_Info('GoldenLayout Wrapper: Loading layout structure...');
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
			root: Content,
		});

		Log_Info('GoldenLayout Wrapper: Layout loaded successfully.');

		if (componentParts && Object.keys(componentParts).length > 0) {
			applyTailwindClasses(layoutContainerEl);
		}

		// ponytail: simplified observer to detect layout changes and ensure self-healing "+" button
		mutationObserver = new MutationObserver((mutations) => {
			try {
				// Re-apply classes if layout DOM changes
				if (componentParts && Object.keys(componentParts).length > 0) {
					const shouldSync = mutations.some(
						(m) =>
							m.addedNodes.length > 0 ||
							(m.type === 'attributes' &&
								m.target instanceof HTMLElement &&
								['lm_goldenlayout', 'lm_content', 'lm_header', 'lm_splitter', 'lm_dragProxy', 'lm_tab'].some((cls) =>
									(m.target as HTMLElement).classList.contains(cls),
								)),
					);

					if (shouldSync && layoutContainerEl) {
						applyTailwindClasses(layoutContainerEl);
					}
				}

				// Check and restore "+" buttons if they were removed during layout updates
				layoutContainerEl.querySelectorAll('.lm_header').forEach((headerEl) => {
					if (headerEl instanceof HTMLElement) {
						const stack = headerStackMap.get(headerEl);
						if (stack) {
							appendPlusButton(stack);
						}
					}
				});
			} catch (err) {
				console.error('GoldenLayout Wrapper: Error in mutationObserver callback:', err);
			}
		});

		mutationObserver.observe(layoutContainerEl, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['class'],
		});

		resizeObserver = new ResizeObserver(() => {
			if (LAYOUT && layoutContainerEl) {
				LAYOUT.setSize(layoutContainerEl.clientWidth, layoutContainerEl.clientHeight);
			}
		});
		resizeObserver.observe(layoutContainerEl);

		const cleanup = () => {
			if (resizeObserver) resizeObserver.disconnect();
			if (mutationObserver) mutationObserver.disconnect();
			if (LAYOUT) LAYOUT.destroy();
			layout = null;
		};

		return cleanup;
	} catch (err) {
		console.error('GoldenLayout Wrapper: Fatal error in onMount:', err);
		return () => {};
	}
});
</script>

<div
  class="container-wrapper {className}"
  class:has-custom-theme={hasTheme}
  style="width: 100%; height: 100%; position: relative; overflow: hidden; {cssVariables}"
>
  <div id="the-layout" style="width: 100%; height: 100%;" bind:this={layoutContainerEl}></div>
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
