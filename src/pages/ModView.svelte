<script lang="ts">
  import { onMount } from "svelte";
  import CenteredLayout from "../layouts/CenteredLayout.svelte";
  import {SearchSolid} from "flowbite-svelte-icons";
  import { Construct_LocalMods } from "../setup.DI.helpers";

  const localMods = Construct_LocalMods({filePath:"./BROWSER-LOCAL-MODS.json", indent:2})
  let modNames = $state<string[]>([]);

  onMount(async ()=> {
    modNames = await localMods.GetModsInstalledNames();

    return () =>{
      localMods.destroy()
    }
  });
  

</script>

<CenteredLayout className="bg-zinc-900 text-white relative" >
  <article class="flex flex-row gap-4 justify-items-center items-center">
    <input type="text" name="" id="" class="rounded-xl bg-zinc-800 py-4 px-4 text-2xl font-inter" placeholder="Busca el mod" >
    <SearchSolid class="shrink-0 size-14" />
  </article>
  <!-- {#await modNamesPromise}
    <p>Mods are being loaded</p>
  {:then response} 
    
  {/await} -->
</CenteredLayout>