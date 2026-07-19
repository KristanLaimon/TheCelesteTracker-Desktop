<script lang="ts">
// import { onMount } from 'svelte';
import CenteredLayout from '../layouts/CenteredLayout.svelte';
import { GetDependency } from '../libs/DI';
import Everest from '../libs/Everest';

const EVEREST = GetDependency(Everest);

async function GetModsInfo(){
  console.log("about to get mod data");
	const mods = await EVEREST.GetAllModsInfo();
	console.log(mods);
  console.log("mod data achieved");
};

function LimitText(desc: string, limitCharsCount: number): string {
	if (desc.length < limitCharsCount) return desc;
	return `${desc.slice(0, limitCharsCount)}...`;
}
/**
 * Normalizes celeste file names (.zips original raw names) into human-readable titles.
 * Handles:
 * - Version prefixes (e.g., "0.3.10--Name.zip" -> "Name")
 * - Underscores to spaces (e.g., "Agent8_Skinmod" -> "Agent8 Skinmod")
 * - CamelCase/PascalCase to words (e.g., "BetterRefillGems" -> "Better Refill Gems")
 * - Removes file extensions
 */
// function NormalizeCelesteModName(filename: string): string {
// 	// 1. Remove file extension
// 	let name = filename.replace(/\.(zip|txt)$/i, '');

// 	// 2. Remove versioning prefixes (e.g., "0.3.10--", "2.1.3-")
// 	name = name.replace(/^(\d+\.)+\d+[-]+/, '');

// 	// 3. Replace underscores with spaces
// 	name = name.replace(/_/g, ' ');

// 	// 4. Add spaces before capital letters (for CamelCase),
// 	// but avoid adding them at the start or if there's already a space
// 	name = name.replace(/([a-z])([A-Z])/g, '$1 $2');

// 	// 5. Trim extra whitespace and ensure title-like formatting
// 	return name.trim();
// }
</script>

<CenteredLayout>
  <main class="root">
    <header class="header">
      <!-- //Mods searchable -->
      <input class="search" type="text" name="search" />
    </header>
    <!-- All mods list in grid, automatically sorted by whats being searched (in real time as typing) -->
    <article class="content"></article>
    <button class="cursor-pointer" onclick={() => {GetModsInfo()}}>FETCH MOD DATA</button>
  </main>
</CenteredLayout>

{#snippet ModCard(props: {
  coverUrl: string;
  modName: string;
  description: string;
  totalDownloads: number;
  author: string;
})}
  {@const description: string = LimitText(props.description, 50)}
  <article>
    <!-- Header -->
    <header>
      <img
        src={props.coverUrl}
        alt={`${props.modName}-${props.author}-${props.coverUrl}`}
      />
    </header>
    <!-- Content -->
    <div>
      <!-- Title -->
      <h2>{props.modName}</h2>
      <p>{description}</p>
    </div>
  </article>
{/snippet}
