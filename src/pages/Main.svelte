<script lang="ts">
import type { ComponentProps } from "svelte";
import Canvas from "../libs/GoldenLayoutThemes/components/GL_Canvas.svelte";
import RawHtml from "./available/RawHtml.svelte";
import GoldenLayout from "../libs/GoldenLayoutThemes/GoldenLayout.svelte";
import type {
	GoldenLayoutComponentStylesOverrides,
	GoldenLayoutContent,
	GoldenLayoutRegistry,
	GoldenLayoutThemeCssColorsOverrides,
} from "../libs/GoldenLayoutThemes/GoldenLayout.types";
import ModView from "./available/ModView.svelte";

const registry = {
	canvas: Canvas,
	rawHtml: RawHtml,
	modView: ModView,
} satisfies GoldenLayoutRegistry;

const customLayoutStyles: GoldenLayoutComponentStylesOverrides = {
	container: {
		background: "var(--apptheme-bg-app)",
		borderRadius: "8px",
		overflow: "hidden",
		border: "1px solid var(--apptheme-accent-secondary)",
	},
	layout: {
		background: "var(--apptheme-bg-app)",
	},
	content: {
		background: "var(--apptheme-bg-card)",
		border: "1px solid var(--apptheme-accent-secondary)",
		borderRadius: "6px",
	},
	header: {
		background: "var(--apptheme-bg-app)",
		borderBottom: "1px solid var(--apptheme-accent-secondary)",
	},
	tab: {
		background: "var(--apptheme-bg-card)",
		color: "var(--apptheme-text-secondary)",
		border: "1px solid var(--apptheme-accent-secondary)",
		borderRadius: "4px 4px 0 0",
		margin: "0 2px",
		padding: "4px 28px 4px 12px",
	},
	activeTab: {
		background: "var(--apptheme-accent-primary)",
		color: "var(--apptheme-text-primary)",
		fontWeight: "600",
		border: "1px solid var(--apptheme-accent-primary-hover)",
		boxShadow: "0 0 12px rgba(232, 74, 95, 0.35)",
		padding: "4px 28px 4px 12px",
	},
	splitter: {
		background: "var(--apptheme-accent-secondary)",
	},
	dragProxy: {
		background: "var(--apptheme-bg-card)",
		border: "1px solid var(--apptheme-accent-primary)",
		opacity: "0.9",
	},
};

const customLayoutTheme: GoldenLayoutThemeCssColorsOverrides = {
	layoutBg: "var(--apptheme-bg-app)",
	contentBg: "var(--apptheme-bg-card)",
	contentBorder: "1px solid var(--apptheme-accent-secondary)",
	splitterBg: "var(--apptheme-accent-secondary)",
	splitterHoverBg: "var(--apptheme-accent-primary)",
	headerBg: "var(--apptheme-bg-app)",
	tabBg: "var(--apptheme-bg-card)",
	tabText: "var(--apptheme-text-secondary)",
	activeTabBg: "var(--apptheme-accent-primary)",
	activeTabText: "var(--apptheme-text-primary)",
	tabHoverBg: "var(--apptheme-accent-secondary)",
	tabHoverText: "var(--apptheme-text-primary)",
	dragProxyBg: "var(--apptheme-bg-card)",
	dragProxyBorder: "1px solid var(--apptheme-accent-primary)",
};

const Layout_InitialContent: GoldenLayoutContent<typeof registry> = {
	type: "row",
	content: [
		{
			type: "row",
			content: [
				{
					type: "stack",
					content: [
						{
							type: "canvas",
							props: { localStorageKey: "canvas-1" } satisfies ComponentProps<typeof Canvas>,
						},
						{
							type: "rawHtml",
							props: { htmlContent: "Hola, raw HTML 2" } satisfies ComponentProps<typeof RawHtml>,
						},
						{
							type: "modView",
							props: { searchQuery: "Strawberry YAM" },
							//isClosable: boolean
						},
					],
				},
			],
		},
	],
};
</script>

<main id="root-app">
  <div class="layout-wrapper">
    <GoldenLayout
      content={Layout_InitialContent}
      components={registry}
      defaultComponent={RawHtml}
      persistence={{localStorageKey: "main-layout"}}
      theme={customLayoutTheme}
      overrideComponentStyles={customLayoutStyles}
    />
  </div>
</main>

<style>
  #root-app {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .layout-wrapper {
    width: 95%;
    height: 95%;
  }

  :global(body) {
    overflow: hidden;
  }
</style>
