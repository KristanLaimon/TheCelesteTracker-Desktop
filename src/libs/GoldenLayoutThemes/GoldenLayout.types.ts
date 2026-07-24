// UNIVERSAL COMPATIBILITY
import type { Component, ComponentProps } from "svelte";

/**
 * Registry mapping component names to their Svelte component definitions.
 */
// biome-ignore lint/suspicious/noExplicitAny: generic component parameters require any
export type GoldenLayoutRegistry = Record<string, Component<any, any, any>>;

export type WithGLState<TState extends Record<string, unknown> = Record<string, unknown>> = {
	onStateChange?: (state: Partial<TState>) => void;
} & Partial<TState>;

/**
 * Configuration for a custom component item in GoldenLayout.
 */
export type CustomComponentItemConfig<R extends GoldenLayoutRegistry = GoldenLayoutRegistry> = {
	/** The tab title for the component. */
	title?: string;
	/** Optional unique identifier(s) for the item. */
	id?: string | string[];
	/**
	 * Whether the component can be closed by the user.
	 * @default true
	 */
	isClosable?: boolean;
	/**
	 * Pinning state for the tab item.
	 * - `false`: Unpinned (default).
	 * - `true`: Pinned to the left, cannot be closed while pinned, can be toggled/unpinned via UI.
	 * - `"forever"`: Permanently pinned to the left, cannot be unpinned or closed.
	 * @default false
	 */
	isPinned?: boolean | "forever";
	/**
	 * The width of the component. Can be a percentage string (e.g. `'60%'`),
	 * a pixel string (e.g. `'200px'`), or a relative weight number.
	 */
	width?: number | string;
	/**
	 * The height of the component. Can be a percentage string (e.g. `'60%'`),
	 * a pixel string (e.g. `'200px'`), or a relative weight number.
	 */
	height?: number | string;
	/** Minimum width in pixels. */
	minWidth?: number;
	/** Minimum height in pixels. */
	minHeight?: number;
	// biome-ignore lint/suspicious/noExplicitAny: Needed to support arbitrary/excess config fields
	[key: string]: any;
} & {
	[K in keyof R]: {
		/** The registered component type key. */
		type: K;
		/** Optional properties to pass into the Svelte component. */
		props?: ComponentProps<R[K]>;
	};
}[keyof R];

/**
 * Configuration for a row or column container in GoldenLayout.
 */
export type CustomRowOrColumnItemConfig<R extends GoldenLayoutRegistry = GoldenLayoutRegistry> = {
	/** Whether items inside this container lay out horizontally ('row') or vertically ('column'). */
	type: "row" | "column";
	/** The child layout items inside this row or column. */
	content: CustomChildItemConfig<R>[];
	/** Optional unique identifier(s) for the row/column container. */
	id?: string | string[];
	/**
	 * The width of the row or column. Can be a percentage string (e.g. `'60%'`),
	 * a pixel string (e.g. `'200px'`), or a relative weight number.
	 */
	width?: number | string;
	/**
	 * The height of the row or column. Can be a percentage string (e.g. `'60%'`),
	 * a pixel string (e.g. `'200px'`), or a relative weight number.
	 */
	height?: number | string;
};

/**
 * Configuration for a stack (tabbed container) in GoldenLayout.
 */
export type CustomStackItemConfig<R extends GoldenLayoutRegistry = GoldenLayoutRegistry> = {
	/** Layout type identifier for tabbed stacks. */
	type: "stack";
	/** The child component items configured under this stack. */
	content: CustomComponentItemConfig<R>[];
	/** Optional unique identifier(s) for the stack container. */
	id?: string | string[];
	/**
	 * The width of the stack. Can be a percentage string (e.g. `'60%'`),
	 * a pixel string (e.g. `'200px'`), or a relative weight number.
	 */
	width?: number | string;
	/**
	 * The height of the stack. Can be a percentage string (e.g. `'60%'`),
	 * a pixel string (e.g. `'200px'`), or a relative weight number.
	 */
	height?: number | string;
	/** The index of the active tab component within the stack. */
	activeItemIndex?: number;
};

/**
 * Union of all potential layout configurations that can be a child item in the tree.
 */
export type CustomChildItemConfig<R extends GoldenLayoutRegistry = GoldenLayoutRegistry> =
	| CustomRowOrColumnItemConfig<R>
	| CustomStackItemConfig<R>
	| CustomComponentItemConfig<R>;

/**
 * Configuration representing the root or complete layout structure.
 */
export type GoldenLayoutContent<R extends GoldenLayoutRegistry = GoldenLayoutRegistry> =
	| CustomRowOrColumnItemConfig<R>
	| CustomStackItemConfig<R>
	| CustomComponentItemConfig<R>;

/**
 * CSS custom color properties to dynamically customize the theme of GoldenLayout.
 */
export interface GoldenLayoutThemeCssColorsOverrides {
	/** Background color of the overall layout. */
	layoutBg?: string;
	/** Background color of individual content/component panels. */
	contentBg?: string;
	/** Border style/color around individual content panels. */
	contentBorder?: string;
	/** Background color of splitters between panels. */
	splitterBg?: string;
	/** Hover background color of splitters when dragged. */
	splitterHoverBg?: string;
	/** Background color of headers where tabs sit. */
	headerBg?: string;
	/** Background color of inactive tabs. */
	tabBg?: string;
	/** Text color of inactive tabs. */
	tabText?: string;
	/** Background color of the active tab. */
	activeTabBg?: string;
	/** Text color of the active tab. */
	activeTabText?: string;
	/** Background color of tabs on hover. */
	tabHoverBg?: string;
	/** Text color of tabs on hover. */
	tabHoverText?: string;
	/** Background color of the proxy panel when dragging tabs/splitters. */
	dragProxyBg?: string;
	/** Border of the proxy panel when dragging. */
	dragProxyBorder?: string;
}

/**
 * Standard CSS properties mapped from CSSStyleDeclaration.
 */
export type CSSProperties = Partial<CSSStyleDeclaration>;

/**
 * Inline style object overrides for key parts of GoldenLayout elements.
 */
export interface GoldenLayoutComponentStylesOverrides {
	/** Style overrides for the root layout outer wrapper container. */
	container?: CSSProperties;
	/** Deprecated alias style overrides for the root layout container. */
	rootContainer?: CSSProperties;
	/** Style overrides for the golden layout main grid. */
	layout?: CSSProperties;
	/** Style overrides applied directly to component content panels. */
	content?: CSSProperties;
	/** Style overrides applied to stack headers. */
	header?: CSSProperties;
	/** Style overrides applied to tabs. */
	tab?: CSSProperties;
	/** Style overrides applied to the active tab. */
	activeTab?: CSSProperties;
	/** Style overrides applied to panel splitters. */
	splitter?: CSSProperties;
	/** Style overrides applied to dragging proxies. */
	dragProxy?: CSSProperties;
}

/**
 * Tailwind-specific overrides structure matching the styles overrides format.
 */
export type GoldenLayoutComponentPartsTailwindCssOverrides = GoldenLayoutComponentStylesOverrides;
