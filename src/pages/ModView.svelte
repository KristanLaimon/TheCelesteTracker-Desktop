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

$inspect(selected)

$effect( () => {
  if (!selected || selected.trim() === ""){
    selectedFullInfo = null;
    return;
  }
  //Possible condition race?? hate you await js
  localMods.GetModFullInfoByModHumanName(selected).then((awaited: EverestModInfo | null) => {
    selectedFullInfo = awaited;
  })
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
      <p>Mod selected! with {JSON.stringify(selectedFullInfo?.metadata)}</p>
    </section>
  {/if}
</CenteredLayout>
