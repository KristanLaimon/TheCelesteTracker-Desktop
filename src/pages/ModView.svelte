<script lang="ts">
import { getColorSync } from 'colorthief';
import { onMount } from 'svelte';
import HorizontalGallery from '../components/HorizontalGallery.svelte';
import SearchDynamic from '../components/SearchDynamic.svelte';
import type { EverestModInfo } from '../libs/Everest';
import type { WithGLState } from '../libs/GoldenLayoutThemes/GoldenLayout.types';
import type { MaddiesApiModInfo } from '../libs/MaddiesAPI';
import { Construct_LocalMods } from '../setup.DI.helpers';

type Props = { searchQuery: string };

let { searchQuery = $bindable(''), onStateChange }: WithGLState<Props> = $props();

const localMods = Construct_LocalMods({ filePath: './data/BROWSER-LOCAL-MODS.json', indent: 2 });

let modNames = $state<string[]>([]);
let loadingInfo = $state(false);
let selectedModName = $state<string>(searchQuery.toString());
let selectedEverestInfo = $state<EverestModInfo | null>(null);
let selectedMaddiesInfo = $state<MaddiesApiModInfo | null>(null);

let heroImage = $state<string | null>(null);
let bgColor = $state<string>('#18181c');

$effect(() => {
	if (!selectedModName || selectedModName.trim() === '') {
		selectedEverestInfo = null;
		selectedMaddiesInfo = null;
		heroImage = null;
		bgColor = '#18181c';
		loadingInfo = false;
		return;
	}
	loadingInfo = true;
	localMods.MaddiesApi_GetModInfoByModHumanName(selectedModName).then((maddiesApiResult) => {
		selectedMaddiesInfo = maddiesApiResult;
		if (maddiesApiResult !== null) {
			loadingInfo = false;
			return;
		}

		localMods.EverestMods_GetModInfoByHumanName(selectedModName).then((everestApiResult) => {
			selectedEverestInfo = everestApiResult;
			if (everestApiResult !== null) {
				loadingInfo = false;
			}
		});
	});
});

$effect(() => {
	const info = selectedMaddiesInfo;
	const screenshots = info?.Screenshots?.length ? info.Screenshots : info?.MirroredScreenshots;
	if (!screenshots?.length) {
		heroImage = null;
		bgColor = '#18181c';
		return;
	}

	const imgUrl = screenshots[0];
	heroImage = imgUrl;

	const img = new Image();
	img.crossOrigin = 'anonymous';
	img.onload = () => {
		try {
			const color = getColorSync(img);
			if (!color) return;
			const { r, g, b } = color.rgb();
			bgColor = `rgb(${Math.round(r * 0.15)}, ${Math.round(g * 0.15)}, ${Math.round(b * 0.15)})`;
		} catch {
			bgColor = '#18181c';
		}
	};
	img.onerror = () => {
		bgColor = '#18181c';
	};
	img.src = imgUrl;
});

onMount(() => {
	localMods.EverestMods_GetListHumanName().then((awaited: string[]) => {
		modNames = awaited;
	});
	return () => {
		localMods.destroy();
	};
});

$effect(() => {
	if (searchQuery) {
		onStateChange?.({ searchQuery });
	}
});
</script>

<div class="h-full overflow-y-auto ">
	<div class="pointer-events-none absolute top-4 left-1/2 z-50 w-auto max-w-[90%] -translate-x-1/2">
		<SearchDynamic
			bind:selected={selectedModName}
			limit={1000}
			searchOptions={{ caseSensitive: false, trimWhitespace: true }}
			bind:inputValue={searchQuery}
			placeholder="Busca el mod"
			bind:items={modNames}
			class="w-full max-w-lg pointer-events-auto"
			overrideStyles={{ results: 'mt-4 max-h-80 overflow-y-auto' }}
		/>
	</div>

	{#if selectedModName}
	{#if loadingInfo}
		<p class="mt-8 text-zinc-400">Loading mod info...</p>
	{:else if selectedMaddiesInfo}
		<section class="w-full h-full" style:background={bgColor}>
			{#if heroImage}
				<div class="relative h-80 w-full overflow-hidden">
					<img src={heroImage} alt="" class="absolute inset-0 h-full w-full object-cover" />
					<div
						class="absolute inset-0"
						style:background={`linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.85) 90%, ${bgColor} 100%)`}
					></div>
					<div class="absolute bottom-0 left-0 right-0 z-10 px-6 py-8">
						<h2 class="text-3xl font-bold drop-shadow-lg">{selectedMaddiesInfo.Name}</h2>
						<p class="mt-1 text-sm text-zinc-300">by {selectedMaddiesInfo.Author}</p>
					</div>
				</div>
			{/if}

			<div class="min-h-[50vh]" style:background={bgColor}>
      <!-- keep w-full -->
				<div class="mx-auto w-full space-y-8 px-6 py-8"> 
					{#if !heroImage}
						<h2 class="text-3xl font-bold">{selectedMaddiesInfo.Name}</h2>
						<p class="text-sm text-zinc-400">by {selectedMaddiesInfo.Author}</p>
					{/if}

					<p class="leading-relaxed text-zinc-200">{selectedMaddiesInfo.Description}</p>

					{#if (selectedMaddiesInfo.Screenshots?.length ?? 0) > 0 || (selectedMaddiesInfo.MirroredScreenshots?.length ?? 0) > 0}
						<div>
							<h3 class="mb-3 text-lg font-semibold text-zinc-300">Screenshots</h3>
							<HorizontalGallery imageHeight="20rem" maxRows={1} images={selectedMaddiesInfo.Screenshots?.length ? selectedMaddiesInfo.Screenshots : selectedMaddiesInfo.MirroredScreenshots} />
						</div>
					{/if}
				</div>
			</div>
		</section>
	{:else if selectedEverestInfo}
		<section class="w-full bg-[#18181c]">
			<div class="mx-auto max-w-4xl px-6 py-8">
				<h2 class="text-3xl font-bold">EVEREST FOUND INFO</h2>
				<p class="mt-4 text-zinc-300">{JSON.stringify(selectedEverestInfo)}</p>
			</div>
		</section>
	{:else}
		<p class="mt-8 text-zinc-500">Mod info not available</p>
	{/if}
{/if}
</div>
