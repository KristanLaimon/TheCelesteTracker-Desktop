<script lang="ts" generics="ComponentsMap extends GoldenLayoutRegistry">
import { type ComponentContainer, GoldenLayout, LayoutConfig, RowOrColumn, Stack } from "golden-layout";
import { type Component, mount, onMount, unmount } from "svelte";
import type {
	CSSProperties,
	GoldenLayoutComponentStylesOverrides,
	GoldenLayoutContent,
	GoldenLayoutRegistry,
	GoldenLayoutThemeCssColorsOverrides,
} from "./GoldenLayout.types";

import "./goldenlayout-base.css";
import "./predefined/goldenlayout-dark-theme.css";
import { Log_Info } from "@utils/Logger";
import { MapPinAltSolid } from "flowbite-svelte-icons";

// Enable real-time live resizing during splitter drag without compound feedback loop or dragStop jumps
// biome-ignore lint/suspicious/noExplicitAny: Needed to patch internal methods
const rowOrColumnProto = RowOrColumn?.prototype as any;
if (rowOrColumnProto && !rowOrColumnProto.__liveResizePatched) {
	rowOrColumnProto.__liveResizePatched = true;

	const originalDragStart = rowOrColumnProto.onSplitterDragStart;
	const originalDrag = rowOrColumnProto.onSplitterDrag;
	const originalDragStop = rowOrColumnProto.onSplitterDragStop;

	rowOrColumnProto.onSplitterDragStart = function (splitter: any) {
		if (originalDragStart) originalDragStart.call(this, splitter);
		const items = this.getSplitItems(splitter);
		if (items?.before && items?.after) {
			const dimension = this._isColumn ? "height" : "width";
			const sizeBefore = parseFloat(items.before.element.style[dimension]) || 0;
			const sizeAfter = parseFloat(items.after.element.style[dimension]) || 0;
			splitter.__liveDragState = {
				initialPixelBefore: sizeBefore,
				initialPixelAfter: sizeAfter,
				initialRelativeBefore: items.before.size,
				initialRelativeAfter: items.after.size,
			};
		}
	};

	rowOrColumnProto.onSplitterDrag = function (splitter: any, offsetX: number, offsetY: number) {
		if (originalDrag) originalDrag.call(this, splitter, offsetX, offsetY);

		const state = splitter.__liveDragState;
		if (state && this._splitterPosition !== null) {
			const items = this.getSplitItems(splitter);
			if (items?.before && items?.after) {
				const offset = this._isColumn ? offsetY : offsetX;
				const totalPixels = state.initialPixelBefore + state.initialPixelAfter;
				if (totalPixels > 0) {
					const minBefore = this.calculateContentItemsTotalMinSize(items.before.contentItems);
					const minAfter = this.calculateContentItemsTotalMinSize(items.after.contentItems);

					let newPixelBefore = state.initialPixelBefore + offset;
					newPixelBefore = Math.max(minBefore, Math.min(totalPixels - minAfter, newPixelBefore));

					const fraction = newPixelBefore / totalPixels;
					const totalRelative = state.initialRelativeBefore + state.initialRelativeAfter;

					items.before.size = fraction * totalRelative;
					items.after.size = (1 - fraction) * totalRelative;

					splitter.element.style.top = "0px";
					splitter.element.style.left = "0px";

					this.updateSize(false);
				}
			}
		}
	};

	rowOrColumnProto.onSplitterDragStop = function (splitter: any) {
		this._splitterPosition = 0;
		if (splitter.__liveDragState) {
			delete splitter.__liveDragState;
		}
		if (originalDragStop) originalDragStop.call(this, splitter);
	};
}

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
	defaultComponentProps?: Record<string, unknown>;

	persistence?: { localStorageKey: string };
};

let {
	content: Content,
	components = $bindable<ComponentsMap>({} as ComponentsMap),
	overrideComponentStyles = {},
	theme = {},
	defaultComponent,
	defaultComponentProps = {},
	persistence = { localStorageKey: "main-layout" },
}: Props = $props();

// INTERNAL VARIABLES
let layoutContainerEl: HTMLDivElement;
let LAYOUT: GoldenLayout | null = null;
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;

// WeakMap to associate HTML header elements to their Stack instances cleanly
const headerStackMap = new WeakMap<HTMLElement, Stack>();

// Pinned state lives in its own storage key, independent of GoldenLayout's saveLayout/loadLayout
// pipeline, which strips any custom (non-native) field it doesn't recognize on every reload.
let pinsMap: Record<string, boolean | "forever"> = {};

function pinsStorageKey(): string {
	return `${persistence.localStorageKey}-pins`;
}

function loadPinsMap() {
	try {
		const raw = localStorage.getItem(pinsStorageKey());
		pinsMap = raw ? JSON.parse(raw) : {};
	} catch {
		pinsMap = {};
	}
}

function savePinsMap() {
	localStorage.setItem(pinsStorageKey(), JSON.stringify(pinsMap));
}

function generateTabId(): string {
	return crypto.randomUUID();
}

// biome-ignore lint/suspicious/noExplicitAny: GoldenLayout item type
function getTabId(item: any): string | null {
	const conf = getItemConfig(item);
	const state = conf?.componentState;
	return state && typeof state === "object" && typeof state.__tabId === "string" ? state.__tabId : null;
}

// biome-ignore lint/suspicious/noExplicitAny: GoldenLayout item tree traversal has no exported public tree-node type
function findItemByTabId(root: any, tabId: string): any | null {
	if (!root) return null;
	if (getTabId(root) === tabId) return root;
	if (Array.isArray(root.contentItems)) {
		for (const child of root.contentItems) {
			const found = findItemByTabId(child, tabId);
			if (found) return found;
		}
	}
	return null;
}

type MountedComponentEntry = {
	instance: Record<string, unknown> | undefined;
	componentName: string;
	state: Record<string, unknown>;
};

// Per-container record of what's currently mounted. Lets focusTab(tabId, newProps) find and
// unmount the live instance for an arbitrary tab, and lets container.stateRequestEvent keep
// working across remounts by delegating to entry.state instead of closing over one fixed box.
const mountedByContainer = new WeakMap<ComponentContainer, MountedComponentEntry>();

/**
 * Mounts `component` into `container.element` with `initialProps`/`initialState` merged in,
 * wires `replaceThisTab`/`createNewTab`/`focusTab`/`onStateChange`, and records the result in
 * `mountedByContainer`. Shared by the initial factory-function mount and focusTab's remount —
 * does not unmount any previous instance, callers do that first via `unmountContainerEntry`.
 */
// biome-ignore lint/suspicious/noExplicitAny: matches existing Component<any, any, any> usage
function mountIntoContainer(
	container: ComponentContainer,
	componentName: string,
	component: Component<any, any, any>,
	initialProps: Record<string, unknown>,
	initialState: Record<string, unknown>,
): void {
	const entry: MountedComponentEntry = { instance: undefined, componentName, state: { ...initialState } };
	mountedByContainer.set(container, entry);
	container.stateRequestEvent = () => mountedByContainer.get(container)?.state ?? {};

	const { replaceThisTab, createNewTab, focusTab } = makeGLStateHelpers(container);
	entry.instance = mount(component, {
		target: container.element,
		props: {
			...initialProps,
			...entry.state,
			replaceThisTab,
			createNewTab,
			focusTab,
			onStateChange: (partialState: any) => {
				entry.state = { ...entry.state, ...partialState };
				LAYOUT?.emit("stateChanged");
			},
		},
	});
}

function unmountContainerEntry(container: ComponentContainer): void {
	const entry = mountedByContainer.get(container);
	if (entry?.instance) unmount(entry.instance);
	mountedByContainer.delete(container);
}

/**
 * Per-component-instance GoldenLayout capabilities exposed via `WithGLState`.
 * Shared by every registered component's factory function (and the default
 * `__defaultComponent` factory) so the three capabilities are defined once.
 */
function makeGLStateHelpers(container: ComponentContainer) {
	const replaceThisTab = (newType: string, title?: string, newState?: Record<string, unknown>) => {
		// biome-ignore lint/suspicious/noExplicitAny: Accessing GoldenLayout item structure
		const item: any = container.parent;
		if (!item) return;
		const stack = item.parent;
		if (!stack || typeof stack.newComponent !== "function") return;

		const index = Array.isArray(stack.contentItems) ? stack.contentItems.indexOf(item) : -1;
		const insertIndex = index !== -1 ? index : undefined;
		const finalState = { __tabId: generateTabId(), ...(newState || {}) };
		const displayTitle = title || newType;

		const newItem = stack.newComponent(newType, finalState, displayTitle, insertIndex);
		item.remove();
		if (newItem && typeof stack.setActiveComponentItem === "function") {
			stack.setActiveComponentItem(newItem);
		}
		LAYOUT?.emit("stateChanged");
	};

	const createNewTab = (newType: string, title?: string, newState?: Record<string, unknown>): string => {
		// biome-ignore lint/suspicious/noExplicitAny: Accessing GoldenLayout item structure
		const myItem: any = container.parent;
		const myStack = myItem?.parent;
		const rowOrColumn = myStack?.parent;
		const newTabId = generateTabId();
		const finalState = { __tabId: newTabId, ...(newState || {}) };
		const displayTitle = title || newType;

		if (rowOrColumn && typeof rowOrColumn.newComponent === "function" && Array.isArray(rowOrColumn.contentItems)) {
			const myIndex = rowOrColumn.contentItems.indexOf(myStack);
			rowOrColumn.newComponent(newType, finalState, displayTitle, myIndex === -1 ? undefined : myIndex + 1);
		} else if (myStack && typeof myStack.newComponent === "function") {
			// ponytail: no RowOrColumn parent (single-stack root) — no spatial "right" exists yet,
			// degrade to a new tab in the same stack instead of throwing. Upgrade to a manual
			// LAYOUT.addItem({type:"row",...}) restructure if this proves to matter in practice.
			myStack.newComponent(newType, finalState, displayTitle);
		}
		LAYOUT?.emit("stateChanged");
		return newTabId;
	};

	const focusTab = (tabId: string, newProps?: Record<string, unknown>): boolean => {
		const existing = findItemByTabId(LAYOUT?.rootItem, tabId);
		if (!existing?.parent || typeof existing.parent.setActiveComponentItem !== "function") return false;

		if (newProps) {
			const targetContainer: ComponentContainer = existing.container;
			const componentName: string = existing.componentType;
			const targetComponent = componentName === "__defaultComponent" ? defaultComponent : components?.[componentName];
			const entry = mountedByContainer.get(targetContainer);

			if (targetComponent && entry) {
				const mergedState = { ...entry.state, ...newProps };
				unmountContainerEntry(targetContainer);
				const initialProps = componentName === "__defaultComponent" ? defaultComponentProps : {};
				mountIntoContainer(targetContainer, componentName, targetComponent, initialProps, mergedState);
				LAYOUT?.emit("stateChanged");
			} else {
				console.error(`GoldenLayout Wrapper: focusTab could not apply newProps for tab "${tabId}" — component "${componentName}" not registered.`);
			}
		}

		existing.parent.setActiveComponentItem(existing);
		return true;
	};

	return { replaceThisTab, createNewTab, focusTab };
}

// biome-ignore lint/suspicious/noExplicitAny: GoldenLayout item type
function resolveIsPinned(item: any): boolean | "forever" {
	const conf = getItemConfig(item);
	if (conf?.isPinned === "forever") return "forever";
	const tabId = getTabId(item);
	if (tabId && pinsMap[tabId] !== undefined) return pinsMap[tabId];
	return conf?.isPinned === true;
}

// DERIVED VALUES
const hasTheme = $derived(theme && Object.keys(theme).length > 0);
const cssVariables = $derived(
	Object.entries(theme)
		.filter(([_, val]) => val)
		.map(([key, val]) => `--gl-${key}:${val}`)
		.join(";"),
);

function kebabCase(str: string): string {
	return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function styleObjectToString(styles?: CSSProperties): string {
	if (!styles) return "";
	return Object.entries(styles)
		.map(([key, val]) => {
			if (val === undefined || val === null || typeof val === "function") return "";
			const cssKey = key.startsWith("--") ? key : kebabCase(key);
			const cssVal = typeof val === "number" && val !== 0 ? `${val}px` : String(val);
			return `${cssKey}:${cssVal}`;
		})
		.filter(Boolean)
		.join(";");
}

const containerStyles = $derived(styleObjectToString(overrideComponentStyles.container || overrideComponentStyles.rootContainer));

function applyStyles(el: HTMLElement, styles?: CSSProperties) {
	if (!styles) return;
	for (const [key, val] of Object.entries(styles)) {
		if (val === undefined || val === null || typeof val === "function") continue;
		const cssKey = key.startsWith("--") ? key : kebabCase(key);
		const cssVal = typeof val === "number" && val !== 0 ? `${val}px` : String(val);
		el.style.setProperty(cssKey, cssVal);
	}
}

// ponytail: simplified style applier using direct inline styling
function applyComponentStyles(root: HTMLElement) {
	if (!overrideComponentStyles || Object.keys(overrideComponentStyles).length === 0) return;
	mutationObserver?.disconnect();

	const selectors: Record<string, string> = {
		layout: ".lm_goldenlayout",
		content: ".lm_content",
		header: ".lm_header",
		splitter: ".lm_splitter",
		dragProxy: ".lm_dragProxy",
	};

	for (const [part, selector] of Object.entries(selectors)) {
		const styles = overrideComponentStyles[part as keyof typeof overrideComponentStyles];
		if (!styles) continue;

		root.querySelectorAll(selector).forEach((el) => {
			applyStyles(el as HTMLElement, styles);
		});
	}

	root.querySelectorAll(".lm_tab").forEach((el) => {
		const tabEl = el as HTMLElement;
		const isAct = tabEl.classList.contains("lm_active");

		const addStyles = isAct ? overrideComponentStyles.activeTab : overrideComponentStyles.tab;
		const removeStyles = isAct ? overrideComponentStyles.tab : overrideComponentStyles.activeTab;

		if (removeStyles) {
			for (const key of Object.keys(removeStyles)) {
				const cssKey = key.startsWith("--") ? key : kebabCase(key);
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
			attributeFilter: ["class"],
		});
	}
}

// ponytail: appends a custom "+" button next to the tabs in the header
function appendPlusButton(stack: Stack) {
	if (!stack.header) return;
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
			stack.newComponent("__defaultComponent", { __tabId: generateTabId() }, "New Tab");
			LAYOUT?.emit("stateChanged");
		};

		tabsContainer.appendChild(btn);

		if (overrideComponentStyles && Object.keys(overrideComponentStyles).length > 0) {
			applyComponentStyles(layoutContainerEl);
		}
	}
}

function setupTabRenaming(root: HTMLElement) {
	root.querySelectorAll(".lm_tab").forEach((tabNode) => {
		const tabEl = tabNode as HTMLElement;
		if (tabEl.classList.contains("gl-add-tab-btn") || tabEl.dataset.renameSetup === "true") return;
		tabEl.dataset.renameSetup = "true";

		const startEditing = () => {
			const titleEl = tabEl.querySelector(".lm_title") as HTMLElement;
			if (!titleEl || titleEl.dataset.editing === "true") return;

			titleEl.dataset.editing = "true";
			const currentTitle = titleEl.textContent?.trim() || "Tab";

			const input = document.createElement("input");
			input.type = "text";
			input.value = currentTitle;
			input.style.cssText =
				"background: #18181c; color: #f1f5f9; border: 1px solid #3b82f6; border-radius: 4px; padding: 1px 4px; font-size: 11px; width: 90px; outline: none; z-index: 10;";

			const finish = (save: boolean) => {
				if (titleEl.dataset.editing !== "true") return;
				titleEl.dataset.editing = "false";
				const newTitle = input.value.trim();
				if (save && newTitle) {
					titleEl.textContent = newTitle;
					LAYOUT?.emit("stateChanged");
				} else {
					titleEl.textContent = currentTitle;
				}
			};

			input.onkeydown = (e) => {
				e.stopPropagation();
				if (e.key === "Enter") {
					e.preventDefault();
					finish(true);
				} else if (e.key === "Escape") {
					e.preventDefault();
					finish(false);
				}
			};

			input.onblur = () => finish(true);

			titleEl.textContent = "";
			titleEl.appendChild(input);
			input.focus();
			input.select();
		};

		tabEl.addEventListener("dblclick", (e) => {
			e.preventDefault();
			e.stopPropagation();
			startEditing();
		});
	});
}

// biome-ignore lint/suspicious/noExplicitAny: Ensure item config object is safely accessed
function getItemConfig(item: any): any {
	if (!item) return {};
	if (item.config) return item.config;
	if (item.configuration) {
		item.config = item.configuration;
		return item.config;
	}
	if (typeof item.toConfig === "function") {
		try {
			item.config = item.toConfig();
		} catch {
			item.config = {};
		}
	} else {
		item.config = {};
	}
	return item.config;
}

function syncTabsAndPinning(rootEl?: HTMLElement) {
	if (!rootEl) return;

	mutationObserver?.disconnect();
	try {
		rootEl.querySelectorAll(".lm_header").forEach((headerNode) => {
			const headerEl = headerNode as HTMLElement;
			const tabsContainer = headerEl.querySelector(".lm_tabs") as HTMLElement;
			if (!tabsContainer) return;

			const stack = headerStackMap.get(headerEl);
			if (!stack) return;

			// biome-ignore lint/suspicious/noExplicitAny: GoldenLayout item type
			const items: any[] = stack.contentItems || [];
			// biome-ignore lint/suspicious/noExplicitAny: GoldenLayout item type
			const pinnedItems: any[] = [];
			// biome-ignore lint/suspicious/noExplicitAny: GoldenLayout item type
			const unpinnedItems: any[] = [];

			for (const item of items) {
				const isPinned = resolveIsPinned(item);
				if (isPinned === true || isPinned === "forever") {
					pinnedItems.push(item);
				} else {
					unpinnedItems.push(item);
				}
			}

			const desiredOrder = [...pinnedItems, ...unpinnedItems];
			const addBtn = tabsContainer.querySelector(".gl-add-tab-btn");

			for (let i = 0; i < desiredOrder.length; i++) {
				const item = desiredOrder[i];
				const el = item.tab?.element as HTMLElement | undefined;
				if (!el) continue;

				const targetNextSibling = i < desiredOrder.length - 1 ? desiredOrder[i + 1].tab?.element || addBtn : addBtn;
				if (el.nextSibling !== targetNextSibling) {
					if (targetNextSibling) {
						tabsContainer.insertBefore(el, targetNextSibling);
					} else {
						tabsContainer.appendChild(el);
					}
				}
			}

			for (const item of items) {
				const tabEl = item.tab?.element as HTMLElement | undefined;
				if (!tabEl) continue;

				const config = getItemConfig(item);
				const isPinned = resolveIsPinned(item);
				const isClosable = config.isClosable !== undefined ? Boolean(config.isClosable) : true;

				const isPinnedActive = isPinned === true || isPinned === "forever";
				const cannotClose = isPinnedActive || !isClosable;

				if (cannotClose) {
					if (!item.__originalRemove) {
						item.__originalRemove = item.remove;
					}
					item.remove = () => {};
					if (item.container) {
						item.container.close = () => {};
					}
				} else if (item.__originalRemove) {
					item.remove = item.__originalRemove;
				}

				if (cannotClose) {
					if (!tabEl.classList.contains("gl-non-closable")) {
						tabEl.classList.add("gl-non-closable");
					}
				} else {
					if (tabEl.classList.contains("gl-non-closable")) {
						tabEl.classList.remove("gl-non-closable");
					}
				}

				if (isPinnedActive) {
					if (!tabEl.classList.contains("gl-pinned-tab")) {
						tabEl.classList.add("gl-pinned-tab");
					}
					let pinWrapper = tabEl.querySelector(".gl-pin-icon-wrapper") as HTMLElement;
					if (!pinWrapper) {
						pinWrapper = document.createElement("span");
						pinWrapper.className = "gl-pin-icon-wrapper inline-flex items-center justify-center mr-1 text-slate-400 shrink-0";
						const titleEl = tabEl.querySelector(".lm_title");
						if (titleEl) {
							tabEl.insertBefore(pinWrapper, titleEl);
						} else {
							tabEl.prepend(pinWrapper);
						}

						const componentInstance = mount(MapPinAltSolid, {
							target: pinWrapper,
							props: {
								class: "h-3 w-3 text-slate-400 shrink-0",
							},
						});

						// biome-ignore lint/suspicious/noExplicitAny: Attached unmount callback
						(pinWrapper as any).__unmountIcon = () => unmount(componentInstance);
					}
				} else {
					if (tabEl.classList.contains("gl-pinned-tab")) {
						tabEl.classList.remove("gl-pinned-tab");
					}
					const pinWrapper = tabEl.querySelector(".gl-pin-icon-wrapper") as HTMLElement;
					if (pinWrapper) {
						// biome-ignore lint/suspicious/noExplicitAny: Retrieve unmount callback
						if (typeof (pinWrapper as any).__unmountIcon === "function") {
							// biome-ignore lint/suspicious/noExplicitAny: Execute unmount callback
							(pinWrapper as any).__unmountIcon();
						}
						pinWrapper.remove();
					}
				}

				if (tabEl.dataset.contextMenuSetup !== "true") {
					tabEl.dataset.contextMenuSetup = "true";
					tabEl.addEventListener("contextmenu", (e) => {
						e.preventDefault();
						e.stopPropagation();

						document.querySelectorAll(".gl-tab-context-menu").forEach((el) => el.remove());

						const menu = document.createElement("div");
						menu.className = "gl-tab-context-menu fixed z-50 bg-[#18181c] text-xs text-[#f1f5f9] border border-[#334155] rounded-md shadow-xl py-1 px-1";
						menu.style.left = `${e.clientX}px`;
						menu.style.top = `${e.clientY}px`;

						const currentPin = resolveIsPinned(item);

						if (currentPin === "forever") {
							const itemEl = document.createElement("div");
							itemEl.className = "px-3 py-1.5 opacity-50 cursor-not-allowed flex items-center gap-2";
							itemEl.textContent = "Pinned (Permanent)";
							menu.appendChild(itemEl);
						} else if (currentPin === true) {
							const itemEl = document.createElement("button");
							itemEl.className = "w-full text-left px-3 py-1.5 hover:bg-[#27272a] rounded cursor-pointer flex items-center gap-2";
							itemEl.textContent = "Unpin Tab";
							itemEl.onclick = () => {
								const tabId = getTabId(item);
								if (tabId) {
									pinsMap[tabId] = false;
									savePinsMap();
								}
								menu.remove();
								syncTabsAndPinning(layoutContainerEl);
							};
							menu.appendChild(itemEl);
						} else {
							const itemEl = document.createElement("button");
							itemEl.className = "w-full text-left px-3 py-1.5 hover:bg-[#27272a] rounded cursor-pointer flex items-center gap-2";
							itemEl.textContent = "Pin Tab";
							itemEl.onclick = () => {
								const tabId = getTabId(item);
								if (tabId) {
									pinsMap[tabId] = true;
									savePinsMap();
								}
								menu.remove();
								syncTabsAndPinning(layoutContainerEl);
							};
							menu.appendChild(itemEl);
						}

						document.body.appendChild(menu);

						const closeMenu = (evt: MouseEvent) => {
							if (!menu.contains(evt.target as Node)) {
								menu.remove();
								window.removeEventListener("click", closeMenu);
								window.removeEventListener("contextmenu", closeMenu);
							}
						};
						setTimeout(() => {
							window.addEventListener("click", closeMenu);
							window.addEventListener("contextmenu", closeMenu);
						}, 10);
					});
				}
			}
		});
	} finally {
		if (mutationObserver && rootEl) {
			mutationObserver.observe(rootEl, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["class"],
			});
		}
	}
}

// LIFECYCLE
onMount(() => {
	let cleanupFn: (() => void) | null = null;

	const handleF2Key = (e: KeyboardEvent) => {
		if (e.key === "F2") {
			const activeTab = layoutContainerEl?.querySelector(".lm_tab.lm_active:not(.gl-add-tab-btn)") as HTMLElement;
			if (activeTab) {
				const titleEl = activeTab.querySelector(".lm_title") as HTMLElement;
				if (titleEl && titleEl.dataset.editing !== "true") {
					activeTab.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
				}
			}
		}
	};
	window.addEventListener("keydown", handleF2Key);

	const init = async () => {
		try {
			// Dynamically load jQuery to prevent TS compile-time inclusion and declaration emit errors
			// biome-ignore lint/suspicious/noExplicitAny: Needed for global window check
			if (!(window as any).$) {
				await new Promise<void>((resolve, reject) => {
					const script = document.createElement("script");
					script.src = new URL("./jquery_1.11.1.min.js", import.meta.url).href;
					script.onload = () => resolve();
					script.onerror = () => reject(new Error("Failed to load jQuery"));
					document.head.appendChild(script);
				});
			}

			Log_Info("GoldenLayout Wrapper: Mounting Svelte Component...");

			if (!layoutContainerEl) {
				console.error("Layout HTML element not found to inject Golden-Layout dependency.");
				return;
			}

			function parseDimension(val: any, containerSize: number): number | undefined {
				if (val === undefined || val === null) return undefined;
				if (typeof val === "number") return val;
				if (typeof val === "string") {
					if (val.endsWith("%")) {
						return parseFloat(val);
					}
					if (val.endsWith("px")) {
						return (parseFloat(val) / containerSize) * 100;
					}
					const num = parseFloat(val);
					if (!Number.isNaN(num)) return num;
				}
				return undefined;
			}

			// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
			function preprocessLayoutContent(item: any): any {
				if (!item) return item;

				if (Array.isArray(item)) {
					return item.map(preprocessLayoutContent);
				}

				if (typeof item === "object") {
					const containerWidth = layoutContainerEl?.clientWidth || 800;
					const containerHeight = layoutContainerEl?.clientHeight || 600;

					const processed = { ...item };
					if ("width" in processed) {
						processed.width = parseDimension(processed.width, containerWidth);
					}
					if ("height" in processed) {
						processed.height = parseDimension(processed.height, containerHeight);
					}

					if (processed.type && processed.type !== "row" && processed.type !== "column" && processed.type !== "stack") {
						// biome-ignore lint/suspicious/noExplicitAny: componentState is a free-form JSON blob
						const componentState: any = { ...(processed.props || {}) };
						if (typeof componentState.__tabId !== "string") componentState.__tabId = generateTabId();
						return {
							type: "component",
							componentType: processed.type,
							componentState,
							title: processed.title || processed.type,
							isClosable: processed.isClosable !== undefined ? Boolean(processed.isClosable) : true,
							isPinned: processed.isPinned !== undefined ? processed.isPinned : false,
							...Object.fromEntries(Object.entries(processed).filter(([k]) => k !== "type" && k !== "props" && k !== "title")),
						};
					}

					if (processed.content) {
						return {
							...processed,
							content: preprocessLayoutContent(processed.content),
						};
					}

					return processed;
				}

				return item;
			}

			loadPinsMap();
			const processedContent = preprocessLayoutContent(Content);

			Log_Info("GoldenLayout Wrapper: Initializing raw GoldenLayout...");
			LAYOUT = new GoldenLayout(layoutContainerEl);

			// Register Svelte components from components registry prop
			if (components) {
				// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
				for (const [name, component] of Object.entries(components) as [string, Component<any, any, any>][]) {
					Log_Info(`GoldenLayout Wrapper: Registering component "${name}"`);
					LAYOUT.registerComponentFactoryFunction(name, (container, state) => {
						try {
							Log_Info(`GoldenLayout Wrapper: Factory function called for "${name}"`);
							mountIntoContainer(container, name, component, {}, (state as Record<string, unknown>) || {});

							container.on("destroy", () => {
								unmountContainerEntry(container);
								setTimeout(() => {
									checkAndSelfHealEmptyLayout();
								}, 20);
							});
						} catch (err) {
							console.error(`GoldenLayout Wrapper: Error mounting component "${name}":`, err);
						}
					});
				}
			}

			// Register the mandatory default Svelte component
			Log_Info("GoldenLayout Wrapper: Registering default component");
			LAYOUT.registerComponentFactoryFunction("__defaultComponent", (container, state) => {
				try {
					Log_Info("GoldenLayout Wrapper: Factory function called for defaultComponent");
					mountIntoContainer(container, "__defaultComponent", defaultComponent, defaultComponentProps, (state as Record<string, unknown>) || {});

					container.on("destroy", () => {
						unmountContainerEntry(container);
						setTimeout(() => {
							checkAndSelfHealEmptyLayout();
						}, 20);
					});
				} catch (err) {
					console.error("GoldenLayout Wrapper: Error mounting defaultComponent:", err);
				}
			});

			// Bind event to track and store stack references on headers for self-healing "+" button
			LAYOUT.on("itemCreated", (event) => {
				const item = event.target;
				if (item instanceof Stack) {
					setTimeout(() => {
						try {
							if (item.header?.element) {
								headerStackMap.set(item.header.element, item);
								appendPlusButton(item);
								if (layoutContainerEl) {
									syncTabsAndPinning(layoutContainerEl);
								}
							}
						} catch (err) {
							console.error("GoldenLayout Wrapper: Error in stack itemCreated handler:", err);
						}
					}, 50);
				}
			});

			Log_Info("GoldenLayout Wrapper: Loading layout structure...");
			const storedPreviousLayout = localStorage.getItem(persistence.localStorageKey);
			let loadedFromCache = false;

			if (storedPreviousLayout && storedPreviousLayout !== "") {
				try {
					const resolvedConfig = JSON.parse(storedPreviousLayout);
					const previousLayout = LayoutConfig.fromResolved(resolvedConfig);
					LAYOUT.loadLayout(previousLayout);
					loadedFromCache = true;
				} catch (err) {
					console.error("GoldenLayout Wrapper: Error loading stored layout, falling back to default:", err);
					localStorage.removeItem(persistence.localStorageKey);
				}
			}

			if (!loadedFromCache) {
				LAYOUT.loadLayout({
					settings: {
						constrainDragToContainer: false,
						reorderEnabled: true,
						popoutWholeStack: false,
						blockedPopoutsThrowError: false,
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
					root: processedContent,
				});
			}

			Log_Info("GoldenLayout Wrapper: Layout loaded successfully.");

			if (overrideComponentStyles && Object.keys(overrideComponentStyles).length > 0) {
				applyComponentStyles(layoutContainerEl);
			}

			if (layoutContainerEl) {
				setupTabRenaming(layoutContainerEl);
				syncTabsAndPinning(layoutContainerEl);
			}

			mutationObserver = new MutationObserver((mutations) => {
				try {
					mutationObserver?.disconnect();

					if (overrideComponentStyles && Object.keys(overrideComponentStyles).length > 0) {
						const shouldSync = mutations.some(
							(m) =>
								m.addedNodes.length > 0 ||
								(m.type === "attributes" &&
									m.target instanceof HTMLElement &&
									["lm_goldenlayout", "lm_content", "lm_header", "lm_splitter", "lm_dragProxy", "lm_tab"].some((cls) =>
										(m.target as HTMLElement).classList.contains(cls),
									)),
						);

						if (shouldSync && layoutContainerEl) {
							applyComponentStyles(layoutContainerEl);
						}
					}

					const hasHeaderOrTabAddition = mutations.some(
						(m) =>
							m.addedNodes.length > 0 &&
							Array.from(m.addedNodes).some(
								(node) => node instanceof HTMLElement && (node.classList.contains("lm_header") || node.classList.contains("lm_tab")),
							),
					);

					if (hasHeaderOrTabAddition && layoutContainerEl) {
						layoutContainerEl.querySelectorAll(".lm_header").forEach((headerEl) => {
							if (headerEl instanceof HTMLElement) {
								const stack = headerStackMap.get(headerEl);
								if (stack) {
									appendPlusButton(stack);
								}
							}
						});

						setupTabRenaming(layoutContainerEl);
						syncTabsAndPinning(layoutContainerEl);
					}
				} catch (err) {
					console.error("GoldenLayout Wrapper: Error in mutationObserver callback:", err);
				} finally {
					if (mutationObserver && layoutContainerEl) {
						mutationObserver.observe(layoutContainerEl, {
							childList: true,
							subtree: true,
							attributes: true,
							attributeFilter: ["class"],
						});
					}
				}
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

			function checkAndSelfHealEmptyLayout() {
				if (!LAYOUT) return;

				// biome-ignore lint/suspicious/noExplicitAny: Recursively collect ComponentItems in layout tree
				const getAllComponentItems = (item: any): any[] => {
					if (!item) return [];
					if (item.isComponent || item.type === "component") return [item];
					if (Array.isArray(item.contentItems)) {
						return item.contentItems.flatMap(getAllComponentItems);
					}
					return [];
				};

				// biome-ignore lint/suspicious/noExplicitAny: Accessing GoldenLayout root layout item
				const root: any = LAYOUT.rootItem || (LAYOUT as any).root;
				const items = getAllComponentItems(root);
				if (items.length === 0) {
					Log_Info("GoldenLayout Wrapper: All tabs closed (tabs === 0). Spawning default new tab...");
					if (root && typeof root.newComponent === "function") {
						root.newComponent("__defaultComponent", { __tabId: generateTabId() }, "New Tab");
					} else if (root && typeof root.addItem === "function") {
						root.addItem({
							type: "component",
							componentType: "__defaultComponent",
							title: "New Tab",
							componentState: { __tabId: generateTabId() },
						});
					} else {
						LAYOUT.loadLayout({
							root: {
								type: "component",
								componentType: "__defaultComponent",
								title: "New Tab",
								componentState: { __tabId: generateTabId() },
							},
						});
					}
				}
			}

			LAYOUT.on("stateChanged", () => {
				if (!LAYOUT) {
					throw new Error("Strange error: stateChanged but layout undefined, not expected");
				}
				checkAndSelfHealEmptyLayout();
				var layoutState = JSON.stringify(LAYOUT.saveLayout());
				localStorage.setItem(persistence.localStorageKey, layoutState);
			});

			cleanupFn = () => {
				window.removeEventListener("keydown", handleF2Key);
				if (resizeObserver) resizeObserver.disconnect();
				if (mutationObserver) mutationObserver.disconnect();
				if (LAYOUT) LAYOUT.destroy();
			};
		} catch (err) {
			console.error("GoldenLayout Wrapper: Fatal error in onMount:", err);
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

  .container-wrapper :global(.lm_header .lm_tab) {
    padding-right: 28px !important;
    display: inline-flex;
    align-items: center;
    position: relative;
  }

  .container-wrapper :global(.lm_header .lm_tab.gl-non-closable),
  .container-wrapper :global(.lm_header .lm_tab.gl-pinned-tab) {
    padding-right: 12px !important;
  }

  .container-wrapper :global(.lm_header .lm_tab .lm_close_tab) {
    position: absolute !important;
    right: 8px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin: 0 !important;
  }

  .container-wrapper :global(.lm_header .lm_tab.gl-non-closable .lm_close_tab),
  .container-wrapper :global(.lm_header .lm_tab.gl-pinned-tab .lm_close_tab) {
    display: none !important;
  }

  .container-wrapper :global(.lm_content),
  .container-wrapper :global(.lm_content *) {
    scrollbar-width: thin;
    scrollbar-color: var(--apptheme-accent-secondary, #2A2A35) var(--apptheme-bg-app, #121216);
  }

  .container-wrapper :global(.lm_content::-webkit-scrollbar),
  .container-wrapper :global(.lm_content *::-webkit-scrollbar) {
    width: 10px;
    height: 10px;
  }

  .container-wrapper :global(.lm_content::-webkit-scrollbar-track),
  .container-wrapper :global(.lm_content *::-webkit-scrollbar-track) {
    background: var(--apptheme-bg-app, #121216);
  }

  .container-wrapper :global(.lm_content::-webkit-scrollbar-thumb),
  .container-wrapper :global(.lm_content *::-webkit-scrollbar-thumb) {
    background: var(--apptheme-accent-secondary, #2A2A35);
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .container-wrapper :global(.lm_content::-webkit-scrollbar-thumb:hover),
  .container-wrapper :global(.lm_content *::-webkit-scrollbar-thumb:hover) {
    background: #3F3F46;
  }
</style>
