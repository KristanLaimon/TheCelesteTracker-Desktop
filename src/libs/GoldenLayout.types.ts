import type { ComponentItemConfig, RowOrColumnItemConfig, StackItemConfig } from 'golden-layout';
import type { Component } from 'svelte';

export type GoldenLayoutContent = RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig;

// Custom recursive generic types to constrain componentType to a specific union of strings
export type CustomComponentItemConfig<ComponentTypes extends string> = Omit<ComponentItemConfig, 'componentType'> & {
	componentType: ComponentTypes;
};

export type CustomRowOrColumnItemConfig<ComponentTypes extends string> = Omit<RowOrColumnItemConfig, 'content'> & {
	content: CustomChildItemConfig<ComponentTypes>[];
};

export type CustomStackItemConfig<ComponentTypes extends string> = Omit<StackItemConfig, 'content'> & {
	content: CustomComponentItemConfig<ComponentTypes>[];
};

export type CustomChildItemConfig<ComponentTypes extends string> =
	| CustomRowOrColumnItemConfig<ComponentTypes>
	| CustomStackItemConfig<ComponentTypes>
	| CustomComponentItemConfig<ComponentTypes>;

// export type CustomRootContentItemsConfig<ComponentTypes extends string> =
export type CustomRootContentItemsConfig<ComponentTypes extends LayoutContentRootConfig> =
	| CustomRowOrColumnItemConfig<keyof ComponentTypes & string>
	| CustomStackItemConfig<keyof ComponentTypes & string>
	| CustomComponentItemConfig<keyof ComponentTypes & string>;

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

export interface GoldenLayoutComponentPartsTailwindCssOverrides {
	layout?: string;
	content?: string;
	header?: string;
	tab?: string;
	activeTab?: string;
	splitter?: string;
	dragProxy?: string;
}
