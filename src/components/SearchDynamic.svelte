<script lang="ts">
import { type SearchOptions, type SearchResult, StringSimilarity_SearchThroughList } from '../libs/StringSimilarity';

type OverrideStyles = {
	input?: string;
	results?: string;
	item?: string;
	activeItem?: string;
};

type Props = {
	items: string[];
	inputValue?: string;
	selectedIndex?: number;
	placeholder?: string;
	class?: string;
	overrideStyles?: OverrideStyles;
	limit?: number;
	minScore?: number;
	searchOptions?: SearchOptions;
	selected?: string;
	children?: import('svelte').Snippet<[item: string, index: number, score: number]>;
};

let {
	items = $bindable([]),
	inputValue = $bindable(''),
	selectedIndex = $bindable(0),
	placeholder = 'Search...',
	class: className = '',
	overrideStyles = {},
	limit = 10,
	minScore = 0,
	searchOptions = {},
	selected = $bindable(''),
	children,
}: Props = $props();

let listEl = $state<HTMLDivElement | undefined>(undefined);
let itemEls = $state<HTMLDivElement[]>([]);
let showDropdown = $state(false);

const uniqueItems = $derived([...new Set(items)]);

const suggestions = $derived.by<SearchResult[]>(() => {
	if (!inputValue || inputValue.trim().length === 0) return [];
	return StringSimilarity_SearchThroughList(inputValue, uniqueItems, { caseSensitive: false, trimWhitespace: true, ...searchOptions, limit, minScore });
});

function handleInput() {
	selectedIndex = 0;
	showDropdown = inputValue.trim().length > 0;
}

$effect(() => {
	const el = itemEls[selectedIndex];
	if (el && listEl) {
		el.scrollIntoView({ block: 'nearest' });
	}
});

function selectItem(item: string) {
	inputValue = item;
	selected = item;
	showDropdown = false;
}

let blurTimeout: ReturnType<typeof setTimeout>;
function handleBlur() {
	blurTimeout = setTimeout(() => {
		showDropdown = false;
	}, 200);
}

function handleFocus() {
	clearTimeout(blurTimeout);
}

function handleKeyDown(e: KeyboardEvent) {
	if (e.key === 'ArrowDown') {
		e.preventDefault();
		showDropdown = true;
		if (selectedIndex < suggestions.length - 1) selectedIndex++;
	} else if (e.key === 'ArrowUp') {
		e.preventDefault();
		showDropdown = true;
		if (selectedIndex > 0) selectedIndex--;
	} else if (e.key === 'Enter') {
		e.preventDefault();
		const found = suggestions[selectedIndex];
		if (found) {
			selectItem(found.item);
		}
	} else if (e.key === 'Escape') {
		showDropdown = false;
	}
}
</script>

<div class="flex w-full flex-col gap-2 {className}">
	<div class="relative w-full">
		<svg
			class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
		<input
			bind:value={inputValue}
			oninput={handleInput}
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			onfocus={handleFocus}
			type="text"
			class="w-full rounded-md border border-zinc-800 bg-zinc-950 py-2 pr-3 pl-9 text-sm text-zinc-50 placeholder:text-zinc-500 transition-[border-color,box-shadow] duration-150 outline-none focus:border-zinc-600 focus:ring-3 focus:ring-zinc-800 sm:py-2.5 sm:text-base {overrideStyles.input ?? ''}"
			{placeholder}
		/>
	</div>

	{#if showDropdown && suggestions.length > 0}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={listEl}
			onmousedown={() => clearTimeout(blurTimeout)}
			class="flex max-h-60 w-full flex-col overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 p-1 [scrollbar-color:theme(colors.zinc.700)_transparent] [scrollbar-width:thin] sm:max-h-80 {overrideStyles.results ?? ''}"
		>
			{#each suggestions as result, i}
				{#if children}
					<div bind:this={itemEls[i]} class="mx-0.5 my-0.5">
						{@render children(result.item, i, result.score)}
					</div>
				{:else}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_mouse_events_have_key_events -->
					<div
						bind:this={itemEls[i]}
						class="cursor-pointer rounded-sm px-3 py-1.5 text-sm text-zinc-300 transition-colors duration-100 hover:bg-zinc-900 hover:text-zinc-50 sm:text-base {i === selectedIndex ? 'bg-zinc-900 text-zinc-50 ' + (overrideStyles.activeItem ?? '') : (overrideStyles.item ?? '')}"
						onclick={() => selectItem(result.item)}
						onmouseover={() => selectedIndex = i}
					>
						{result.item}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
