<script lang="ts">
import { onMount } from 'svelte';
import CenteredLayout from '../layouts/CenteredLayout.svelte';
import { Construct_LocalMods } from '../setup.DI.helpers';
import SearchDynamic from '../components/SearchDynamic.svelte';
import HorizontalGallery from '../components/HorizontalGallery.svelte';
import type { EverestModInfo } from "../libs/Everest";
import type { MaddiesApiModInfo } from "../libs/MaddiesAPI";
import type { WithGLState } from '../libs/GoldenLayoutThemes/GoldenLayout.types';

// import mediumZoom from 'medium-zoom'

// mediumZoom("[data-zoomable]");

type Props = { searchQuery: string };

let {searchQuery = $bindable(""), onStateChange}:WithGLState<Props> = $props();

const localMods = Construct_LocalMods({filePath:'./data/BROWSER-LOCAL-MODS.json', indent:2});

let modNames = $state<string[]>([]);
let loadingInfo = $state(false);
let selectedModName = $state<string>(searchQuery.toString() /** a copy */);
let selectedEverestInfo = $state<EverestModInfo | null>(null);
let selectedMaddiesInfo = $state<MaddiesApiModInfo | null>(null);

$effect(() => {
  if (!selectedModName || selectedModName.trim() === "") {
    selectedEverestInfo = null;
    loadingInfo = false;
    return;
  }
  loadingInfo = true;
  localMods.MaddiesApi_GetModInfoByModHumanName(selectedModName).then((maddiesApiResult) => {
    selectedMaddiesInfo = maddiesApiResult;
    if (maddiesApiResult !== null){
      loadingInfo = false;
      return;
    }

    localMods.EverestMods_GetModInfoByHumanName(selectedModName).then((everestApiResult) => {
      selectedEverestInfo = everestApiResult;
      if (everestApiResult !== null){
        loadingInfo = false;
      }
    });
  });
});

onMount(() => {
  localMods.EverestMods_GetListHumanName().then((awaited:string[]) => {
    modNames = awaited
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

<CenteredLayout width="100%" height="100%"  className="bg-zinc-900 text-white flex flex-col">
  <SearchDynamic bind:selected={selectedModName} limit={1000} searchOptions={{caseSensitive: false, trimWhitespace: true}} bind:inputValue={searchQuery} placeholder="Busca el mod" bind:items={modNames} class="w-full max-w-lg" overrideStyles={{ results: 'mt-4 max-h-80 overflow-y-auto' }} />
  {#if selectedModName}
    <section>
      {#if loadingInfo}
        <p>Loading mod info...</p>
      {:else}
        {#if selectedMaddiesInfo !== null}
          <h2>{selectedMaddiesInfo.Name}</h2>
          <p>{selectedMaddiesInfo.Description}</p>
          <HorizontalGallery maxRows={2} images={selectedMaddiesInfo.Screenshots} />
        {:else if selectedEverestInfo}
          <h2>EVEREST FOUND INFO FOUND</h2>
          <p>{JSON.stringify(selectedEverestInfo)}</p>
        {:else}
          <p>Mod info not available</p>
        {/if}
      {/if}
    </section>
  {/if}
</CenteredLayout>
