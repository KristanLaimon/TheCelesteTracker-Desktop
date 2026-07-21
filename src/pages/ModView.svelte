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

$inspect(selected);

$effect(() => {
  if (!selected || selected.trim() === "") {
    selectedFullInfo = null;
    loadingInfo = false;
    return;
  }

  loadingInfo = true;
  let cancelled = false;
  localMods.GetModFullInfoByModHumanName(selected).then((result) => {
    if (!cancelled) {
      selectedFullInfo = result;
      loadingInfo = false;
    }
  });

  return () => { cancelled = true; };
});

onMount(() => {
  localMods.GetModsInstalledNames().then((awaited:string[]) => {
    modNames = awaited
  });
  return () => {
    localMods.destroy();
  };
});
</script>

<CenteredLayout className="bg-zinc-900 text-white">
  <SearchDynamic bind:selected  bind:inputValue={searchQuery} placeholder="Busca el mod" bind:items={modNames} class="w-full max-w-lg" overrideStyles={{ results: 'mt-4 max-h-80 overflow-y-auto' }} />
  {#if selected}
    <section>
      {#if loadingInfo}
        <p>Loading mod info...</p>
      {:else if selectedFullInfo}
        <p>Mod selected: {selectedFullInfo.humanName}</p>
      {:else}
        <p>Mod info not available</p>
      {/if}
    </section>
  {/if}
</CenteredLayout>
