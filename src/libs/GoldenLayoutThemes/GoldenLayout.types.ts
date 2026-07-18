import type { ComponentItemConfig, RowOrColumnItemConfig, StackItemConfig } from 'golden-layout';
import type { Component, ComponentProps } from 'svelte';

// Custom recursive generic types to constrain componentType and type componentState based on component props
export type CustomComponentItemConfig<
	ComponentTypes extends LayoutContentRootConfig = LayoutContentRootConfig,
	K extends keyof ComponentTypes & string = keyof ComponentTypes & string,
> = K extends string
	? Omit<ComponentItemConfig, 'componentType' | 'componentState'> & {
			componentType: K;
			componentState?: ComponentProps<ComponentTypes[K]>;
			componentSvelte?: never;
			componentProps?: never;
			// biome-ignore lint/suspicious/noExplicitAny: Needed to support arbitrary/excess config fields
			[key: string]: any;
		}
	: never;

// Inline component configuration where the Svelte component class is specified directly
// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
export type CustomComponentItemConfigInline<C extends Component<any, any, any> = Component<any, any, any>> = Omit<
	ComponentItemConfig,
	'componentType' | 'componentState'
> & {
	componentSvelte: C;
	componentProps?: ComponentProps<C>;
	componentType?: never;
	componentState?: never;
	// biome-ignore lint/suspicious/noExplicitAny: Needed to support arbitrary/excess config fields
	[key: string]: any;
};

export type CustomRowOrColumnItemConfig<ComponentTypes extends LayoutContentRootConfig = LayoutContentRootConfig> = Omit<RowOrColumnItemConfig, 'content'> & {
	content: CustomChildItemConfig<ComponentTypes>[];
};

export type CustomStackItemConfig<ComponentTypes extends LayoutContentRootConfig = LayoutContentRootConfig> = Omit<StackItemConfig, 'content'> & {
	content: (CustomComponentItemConfig<ComponentTypes> | CustomComponentItemConfigInline)[];
};

export type CustomChildItemConfig<ComponentTypes extends LayoutContentRootConfig = LayoutContentRootConfig> =
	| CustomRowOrColumnItemConfig<ComponentTypes>
	| CustomStackItemConfig<ComponentTypes>
	| CustomComponentItemConfig<ComponentTypes>
	| CustomComponentItemConfigInline;

export type GoldenLayoutContent<ComponentTypes extends LayoutContentRootConfig = LayoutContentRootConfig> =
	| CustomRowOrColumnItemConfig<ComponentTypes>
	| CustomStackItemConfig<ComponentTypes>
	| CustomComponentItemConfig<ComponentTypes>
	| CustomComponentItemConfigInline;

// biome-ignore lint/suspicious/noExplicitAny: Needed for this type only
export type LayoutContentRootConfig = Record<string, Component<any, any, any>>;

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
