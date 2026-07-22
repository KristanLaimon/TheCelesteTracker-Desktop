<script lang="ts">
import { getPaletteSync } from 'colorthief';
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
let paletteCssVars = $state<string>('');

$effect(() => {
	if (!selectedModName || selectedModName.trim() === '') {
		selectedEverestInfo = null;
		selectedMaddiesInfo = null;
		heroImage = null;
		paletteCssVars = '';
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
		paletteCssVars = '';
		return;
	}

	const imgUrl = screenshots[0];
	heroImage = imgUrl;

	const img = new Image();
	img.crossOrigin = 'anonymous';
	img.onload = () => {
		try {
			const palette = getPaletteSync(img, { colorCount: 6 });
			if (!palette) return;
			const vars = palette
				.map((c, i) => {
					const { r, g, b } = c.rgb();
					const dr = Math.round(r * 0.12);
					const dg = Math.round(g * 0.12);
					const db = Math.round(b * 0.12);
					return `--p${i}: ${dr}, ${dg}, ${db}`;
				})
				.join('; ');
			paletteCssVars = vars;
		} catch {
			paletteCssVars = '';
		}
	};
	img.onerror = () => {
		paletteCssVars = '';
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

  <div class="search-float">
    <SearchDynamic
      bind:selected={selectedModName}
      limit={1000}
      searchOptions={{caseSensitive: false, trimWhitespace: true}}
      bind:inputValue={searchQuery}
      placeholder="Busca el mod"
      bind:items={modNames}
      class="w-full max-w-lg"
      overrideStyles={{ results: 'mt-4 max-h-80 overflow-y-auto' }}
    />
  </div>

  {#if selectedModName}
    {#if loadingInfo}
      <p class="mt-8 text-zinc-400">Loading mod info...</p>
    {:else if selectedMaddiesInfo}
      <section class="w-full" style={paletteCssVars ? `--p0: 5, 5, 5; ${paletteCssVars}` : ''}>
        {#if heroImage}
          <div class="hero">
            <img src={heroImage} alt="" class="hero-img" />
            <div class="hero-gradient" style={paletteCssVars ? `background: linear-gradient(180deg, transparent 0%, rgba(var(--p0), 0.3) 40%, rgba(var(--p0), 0.85) 75%, rgb(var(--p0)) 100%);` : ''}></div>
            <div class="hero-content">
              <h2 class="text-3xl font-bold drop-shadow-lg">{selectedMaddiesInfo.Name}</h2>
              <p class="text-sm text-zinc-300 mt-1">by {selectedMaddiesInfo.Author}</p>
            </div>
          </div>
        {/if}

        <div
          class="content-body"
          style={paletteCssVars ? `background: linear-gradient(180deg, rgb(var(--p0)) 0%, rgb(var(--p1)) 20%, rgb(var(--p2)) 40%, rgb(var(--p3)) 60%, rgb(var(--p4)) 80%, rgb(var(--p5)) 100%);` : 'background: #18181c'}
        >
          <div class="max-w-4xl mx-auto px-6 py-8 space-y-8">
            {#if !heroImage}
              <h2 class="text-3xl font-bold">{selectedMaddiesInfo.Name}</h2>
              <p class="text-sm text-zinc-400">by {selectedMaddiesInfo.Author}</p>
            {/if}

            <p class="text-zinc-200 leading-relaxed">{selectedMaddiesInfo.Description}</p>

            {#if (selectedMaddiesInfo.Screenshots?.length ?? 0) > 0 || (selectedMaddiesInfo.MirroredScreenshots?.length ?? 0) > 0}
              <div>
                <h3 class="text-lg font-semibold text-zinc-300 mb-3">Screenshots</h3>
                <HorizontalGallery maxRows={2} images={selectedMaddiesInfo.Screenshots?.length ? selectedMaddiesInfo.Screenshots : selectedMaddiesInfo.MirroredScreenshots} />
              </div>
            {/if}
          </div>
        </div>
      </section>
    {:else if selectedEverestInfo}
      <section class="w-full" style="background: #18181c">
        <div class="max-w-4xl mx-auto px-6 py-8">
          <h2 class="text-3xl font-bold">EVEREST FOUND INFO</h2>
          <p class="mt-4 text-zinc-300">{JSON.stringify(selectedEverestInfo)}</p>
        </div>
      </section>
    {:else}
      <p class="mt-8 text-zinc-500">Mod info not available</p>
    {/if}
  {/if}

<style>
  .hero {
    position: relative;
    width: 100%;
    height: 320px;
    overflow: hidden;
  }

  .hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-gradient {
    position: absolute;
    inset: 0;
  }

  .hero-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 2rem 1.5rem;
    z-index: 1;
  }

  .content-body {
    min-height: 50vh;
  }

  .search-float {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    width: auto;
    max-width: 90%;
    pointer-events: none;
  }

  .search-float :global(*) {
    pointer-events: auto;
  }
</style>
