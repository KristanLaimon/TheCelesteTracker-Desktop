<script lang="ts">
import type { WithGLState } from "../../libs/GoldenLayoutThemes/GoldenLayout.types";
import NewPagePageselector, { type IndexableComponentOption } from "./NewPage.pageselector.svelte";

type Props = {
	indexableComponents?: IndexableComponentOption[];
};

let { indexableComponents = [], replaceThisTab }: WithGLState<Props> = $props();

let isSelectingPage = $state(false);

function handleSelectPage(goldenLayoutKey: string, title: string) {
	isSelectingPage = false;
	if (replaceThisTab) {
		replaceThisTab(goldenLayoutKey, title);
	}
}
</script>

<div class="relative w-full h-full flex flex-col items-center justify-center bg-[#121216] text-[#FFFFFF] font-dmsans p-6 select-none overflow-hidden">
	<!-- Square Placeholder Card -->
	<button
		type="button"
		onclick={() => (isSelectingPage = true)}
		class="group flex flex-col items-center justify-center cursor-pointer focus:outline-none"
		aria-label="Add new page to empty tab"
	>
		<div
			class="w-36 h-36 rounded-2xl border-2 border-dashed border-[#2A2A35] group-hover:border-[#E84A5F] bg-[#1A1A20]/60 group-hover:bg-[#1A1A20] flex items-center justify-center transition-all duration-300 transform group-hover:scale-105"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-12 w-12 text-[#8B8B99] group-hover:text-[#E84A5F] transition-colors duration-300"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
		</div>

		<!-- Text below -->
		<p class="text-sm font-medium text-[#8B8B99] group-hover:text-white mt-5 tracking-wide transition-colors duration-300 text-center">
			Empty tab... press click to add new page
		</p>
	</button>

	<!-- Viewport Overlay Modal Page Selector -->
	{#if isSelectingPage}
		<NewPagePageselector
			{indexableComponents}
			onSelectPage={handleSelectPage}
			onCancel={() => (isSelectingPage = false)}
		/>
	{/if}
</div>
