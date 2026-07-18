<script lang="ts" generics="ComponentsMap extends LayoutContentRootConfig">
import { GoldenLayout, Stack } from 'golden-layout';
import { type Component, mount, onMount, unmount } from 'svelte';
import type {
	CSSProperties,
	GoldenLayoutComponentStylesOverrides,
	GoldenLayoutContent,
	GoldenLayoutThemeCssColorsOverrides,
	LayoutContentRootConfig,
} from './GoldenLayout.types';

import './goldenlayout-base.css';
import './predefined/goldenlayout-dark-theme.css';
import { Log_Info } from '../Logger';

// PUBLIC-PROPS
type Props = {
	// 1. Content: Defines the initial structural content of the layout grid.
	content: GoldenLayoutContent<ComponentsMap>;

	// 2. components: Maps Svelte component classes to Golden Layout names.
	components?: ComponentsMap;

	// 4. overrideComponentStyles: Custom CSS style object overrides for layout parts.
	overrideComponentStyles?: GoldenLayoutComponentStylesOverrides;

	// 5. theme: Dynamic color mapping using CSS custom variables.
	theme?: GoldenLayoutThemeCssColorsOverrides;
	// 6. defaultComponent: Mandatory Svelte component class to render on new "+" tabs.
	// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
	defaultComponent: Component<any, any, any>;
};

let {
	content: Content,
	components = $bindable<ComponentsMap>({} as ComponentsMap),
	overrideComponentStyles = {},
	theme = {},
	defaultComponent,
}: Props = $props();

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

function kebabCase(str: string): string {
	return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function styleObjectToString(styles?: CSSProperties): string {
	if (!styles) return '';
	return Object.entries(styles)
		.map(([key, val]) => {
			if (val === undefined || val === null || typeof val === 'function') return '';
			const cssKey = key.startsWith('--') ? key : kebabCase(key);
			const cssVal = typeof val === 'number' && val !== 0 ? `${val}px` : String(val);
			return `${cssKey}:${cssVal}`;
		})
		.filter(Boolean)
		.join(';');
}

const containerStyles = $derived(styleObjectToString(overrideComponentStyles.container || overrideComponentStyles.rootContainer));

function applyStyles(el: HTMLElement, styles?: CSSProperties) {
	if (!styles) return;
	for (const [key, val] of Object.entries(styles)) {
		if (val === undefined || val === null || typeof val === 'function') continue;
		const cssKey = key.startsWith('--') ? key : kebabCase(key);
		const cssVal = typeof val === 'number' && val !== 0 ? `${val}px` : String(val);
		el.style.setProperty(cssKey, cssVal);
	}
}

// ponytail: simplified style applier using direct inline styling
function applyComponentStyles(root: HTMLElement) {
	if (!overrideComponentStyles || Object.keys(overrideComponentStyles).length === 0) return;
	mutationObserver?.disconnect();

	const selectors: Record<string, string> = {
		layout: '.lm_goldenlayout',
		content: '.lm_content',
		header: '.lm_header',
		splitter: '.lm_splitter',
		dragProxy: '.lm_dragProxy',
	};

	for (const [part, selector] of Object.entries(selectors)) {
		const styles = overrideComponentStyles[part as keyof typeof overrideComponentStyles];
		if (!styles) continue;

		root.querySelectorAll(selector).forEach((el) => {
			applyStyles(el as HTMLElement, styles);
		});
	}

	root.querySelectorAll('.lm_tab').forEach((el) => {
		const tabEl = el as HTMLElement;
		const isAct = tabEl.classList.contains('lm_active');

		const addStyles = isAct ? overrideComponentStyles.activeTab : overrideComponentStyles.tab;
		const removeStyles = isAct ? overrideComponentStyles.tab : overrideComponentStyles.activeTab;

		if (removeStyles) {
			for (const key of Object.keys(removeStyles)) {
				const cssKey = key.startsWith('--') ? key : kebabCase(key);
				tabEl.style.removeProperty(cssKey);
			}
		}

		if (addStyles) {
			applyStyles(tabEl, addStyles);
		}
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

		if (overrideComponentStyles && Object.keys(overrideComponentStyles).length > 0) {
			applyComponentStyles(layoutContainerEl);
		}
	}
}

// LIFECYCLE
onMount(() => {
	let cleanupFn: (() => void) | null = null;

	const init = async () => {
		try {
			// Dynamically load jQuery to prevent TS compile-time inclusion and declaration emit errors
			// biome-ignore lint/suspicious/noExplicitAny: Needed for global window check
			if (!(window as any).$) {
				await new Promise<void>((resolve, reject) => {
					const script = document.createElement('script');
					script.src = new URL('./jquery_1.11.1.min.js', import.meta.url).href;
					script.onload = () => resolve();
					script.onerror = () => reject(new Error('Failed to load jQuery'));
					document.head.appendChild(script);
				});
			}

			Log_Info('GoldenLayout Wrapper: Mounting Svelte Component...');

			if (!layoutContainerEl) {
				console.error('Layout HTML element not found to inject Golden-Layout dependency.');
				return;
			}

			let inlineComponentCounter = 0;
			// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
			const inlineComponentsMap = new Map<string, Component<any, any, any>>();

			// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
			function preprocessLayoutContent(item: any): any {
				if (!item) return item;

				if (Array.isArray(item)) {
					return item.map(preprocessLayoutContent);
				}

				if (typeof item === 'object') {
					if (item.type === 'component') {
						if (item.componentSvelte) {
							inlineComponentCounter++;
							const uniqueName = `__inline_svelte_component_${inlineComponentCounter}`;
							inlineComponentsMap.set(uniqueName, item.componentSvelte);
							return {
								...item,
								componentType: uniqueName,
								componentState: item.componentProps || {},
								componentSvelte: undefined,
								componentProps: undefined,
							};
						}
					}

					if (item.content) {
						return {
							...item,
							content: preprocessLayoutContent(item.content),
						};
					}
				}

				return item;
			}

			const processedContent = preprocessLayoutContent(Content);

			Log_Info('GoldenLayout Wrapper: Initializing raw GoldenLayout...');
			LAYOUT = new GoldenLayout(layoutContainerEl);

			// Register Svelte components from components registry prop
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

			// Register dynamically found inline components
			for (const [name, component] of inlineComponentsMap.entries()) {
				Log_Info(`GoldenLayout Wrapper: Registering inline component "${name}"`);
				LAYOUT.registerComponentFactoryFunction(name, (container, state) => {
					try {
						Log_Info(`GoldenLayout Wrapper: Factory function called for inline "${name}"`);
						const componentInstance = mount(component, {
							target: container.element,
							props: (state as Record<string, unknown>) || {},
						});

						container.on('destroy', () => {
							unmount(componentInstance);
						});
					} catch (err) {
						console.error(`GoldenLayout Wrapper: Error mounting inline component "${name}":`, err);
					}
				});
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
				root: processedContent,
			});

			Log_Info('GoldenLayout Wrapper: Layout loaded successfully.');

			if (overrideComponentStyles && Object.keys(overrideComponentStyles).length > 0) {
				applyComponentStyles(layoutContainerEl);
			}

			// ponytail: simplified observer to detect layout changes and ensure self-healing "+" button
			mutationObserver = new MutationObserver((mutations) => {
				try {
					// Re-apply styles if layout DOM changes
					if (overrideComponentStyles && Object.keys(overrideComponentStyles).length > 0) {
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
							applyComponentStyles(layoutContainerEl);
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

			cleanupFn = () => {
				if (resizeObserver) resizeObserver.disconnect();
				if (mutationObserver) mutationObserver.disconnect();
				if (LAYOUT) LAYOUT.destroy();
			};
		} catch (err) {
			console.error('GoldenLayout Wrapper: Fatal error in onMount:', err);
		}
	};

	init();

	return () => {
		if (cleanupFn) cleanupFn();
	};
});
</script>

<div
  class="container-wrapper"
  class:has-custom-theme={hasTheme}
  style="width: 100%; height: 100%; position: relative; overflow: hidden; {cssVariables}; {containerStyles}"
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
