<script lang="ts">
import { onMount } from 'svelte';
import CenteredLayout from '../layouts/CenteredLayout.svelte';
import { Construct_LocalMods } from '../setup.DI.helpers';
import SearchDynamic from '../components/SearchDynamic.svelte';
import type { EverestModInfo } from "../libs/Everest";

const localMods = Construct_LocalMods({filePath:'./data/BROWSER-LOCAL-MODS.json', indent:2});

let modNames = $state<string[]>([]);
let searchQuery = $state<string>('');
let selected = $state<string>("");
let selectedFullInfo = $state<EverestModInfo | null>(null);
let loadingInfo = $state(false);

$effect(() => {
  if (!selected || selected.trim() === "") {
    selectedFullInfo = null;
    loadingInfo = false;
    return;
  }
  loadingInfo = true;
  localMods.EverestMods_GetModByHumanName(selected).then((result) => {
    selectedFullInfo = result;
    loadingInfo = false;
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
</script>

<CenteredLayout className="bg-zinc-900 text-white flex flex-col">
  <SearchDynamic bind:selected  bind:inputValue={searchQuery} placeholder="Busca el mod" bind:items={modNames} class="w-full max-w-lg" overrideStyles={{ results: 'mt-4 max-h-80 overflow-y-auto' }} />
  {#if selected}
    <section>
      {#if loadingInfo}
        <p>Loading mod info...</p>
      {:else if selectedFullInfo}
        <p>Mod selected: {JSON.stringify(selectedFullInfo)}</p>
      {:else}
        <p>Mod info not available</p>
      {/if}
    </section>
  {/if}
</CenteredLayout>
