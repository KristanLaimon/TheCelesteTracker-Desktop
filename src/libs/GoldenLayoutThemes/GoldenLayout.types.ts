import type { Component, ComponentProps } from 'svelte';

// biome-ignore lint/suspicious/noExplicitAny: generic component parameters require any
export type GoldenLayoutRegistry = Record<string, Component<any, any, any>>;

// Custom component item configuration that matches the registry
export type CustomComponentItemConfig<R extends GoldenLayoutRegistry = GoldenLayoutRegistry> = {
	title?: string;
	id?: string | string[];
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	// biome-ignore lint/suspicious/noExplicitAny: Needed to support arbitrary/excess config fields
	[key: string]: any;
} & {
	[K in keyof R]: {
		type: K;
		props?: ComponentProps<R[K]>;
	};
}[keyof R];

export type CustomRowOrColumnItemConfig<R extends GoldenLayoutRegistry = GoldenLayoutRegistry> = {
	type: 'row' | 'column';
	content: CustomChildItemConfig<R>[];
	id?: string | string[];
	width?: number;
	height?: number;
};

export type CustomStackItemConfig<R extends GoldenLayoutRegistry = GoldenLayoutRegistry> = {
	type: 'stack';
	content: CustomComponentItemConfig<R>[];
	id?: string | string[];
	width?: number;
	height?: number;
	activeItemIndex?: number;
};

export type CustomChildItemConfig<R extends GoldenLayoutRegistry = GoldenLayoutRegistry> =
	| CustomRowOrColumnItemConfig<R>
	| CustomStackItemConfig<R>
	| CustomComponentItemConfig<R>;

export type GoldenLayoutContent<R extends GoldenLayoutRegistry = GoldenLayoutRegistry> =
	| CustomRowOrColumnItemConfig<R>
	| CustomStackItemConfig<R>
	| CustomComponentItemConfig<R>;

export interface GoldenLayoutThemeCssColorsOverrides {
	layoutBg?: string;
	contentBg?: string;
	contentBorder?: string;
	splitterBg?: string;
	splitterHoverBg?: string;
	headerBg?: string;
	tabBg?: string;
	tabText?: string;
	activeTabBg?: string;
	activeTabText?: string;
	tabHoverBg?: string;
	tabHoverText?: string;
	dragProxyBg?: string;
	dragProxyBorder?: string;
}

export type CSSProperties = Partial<CSSStyleDeclaration>;

export interface GoldenLayoutComponentStylesOverrides {
	container?: CSSProperties;
	rootContainer?: CSSProperties;
	layout?: CSSProperties;
	content?: CSSProperties;
	header?: CSSProperties;
	tab?: CSSProperties;
	activeTab?: CSSProperties;
	splitter?: CSSProperties;
	dragProxy?: CSSProperties;
}

export type GoldenLayoutComponentPartsTailwindCssOverrides = GoldenLayoutComponentStylesOverrides;
