import type { ComponentItemConfig, RowOrColumnItemConfig, StackItemConfig } from 'golden-layout';

export type GoldenLayoutContent = RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig;

export interface GoldenLayoutThemeCssColorsObject {
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

export interface GoldenLayoutComponentPartsTailwindStylesObject {
  layout?: string;
  content?: string;
  header?: string;
  tab?: string;
  activeTab?: string;
  splitter?: string;
  dragProxy?: string;
}
