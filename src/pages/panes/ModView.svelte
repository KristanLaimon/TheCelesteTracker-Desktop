<script lang="ts">
import { getColorSync } from "colorthief";
import { onMount } from "svelte";
import type { MaddiesApiModInfo } from "../../api/MaddiesAPI";
import goldenStrawberryIcon from "../../assets/interface_goldenstrawberry_icon.png";
import deathsIcon from "../../assets/interface_SIDEA_deaths_icon.png";
import heartIcon from "../../assets/interface_SIDEA_heart.png";
import miniHeartIcon from "../../assets/interface_SIDEB_heart.png";
import strawberryIcon from "../../assets/interface_strawberry_icon.png";
import timerIcon from "../../assets/interface_timer_icon.png";
import HorizontalGallery from "../../components/HorizontalGallery.svelte";
import SearchDynamic from "../../components/SearchDynamic.svelte";
import type { EverestModInfo } from "../../domain/Everest";
import type { ModSimplified, ModStatisticsResult } from "../../domain/LocalMods";
import type { WithGLState } from "../../libs/GoldenLayoutThemes/GoldenLayout.types";
import { DB_Mods as localMods } from "../../setup";
import saveSlotStore from "../../stores/SaveSlot.store.svelte";
import { logger } from "../../utils/Logger";
import { formatPlayTime } from "../../utils/Time";

type Props = { searchQuery: string; showSearchBar: boolean };

let { searchQuery = $bindable(""), onStateChange, showSearchBar = true }: WithGLState<Props> = $props();

let simplifiedMods = $state<ModSimplified[]>([]);
let humanNamesList = $derived(simplifiedMods.map((m) => m.humanNameMod));
let loadingInfo = $state(false);
let selectedName = $state<string>(searchQuery.toString());

let selectedEverestInfo = $state<EverestModInfo | null>(null);
let selectedMaddiesInfo = $state<MaddiesApiModInfo | null>(null);

let heroImage = $state<string | null>(null);
let bgColor = $state<string>("#18181c");

let modStats = $state<ModStatisticsResult | null>(null);
let loadingStats = $state(false);

const selectedModId = $derived.by(() => {
	if (!selectedName || selectedName.trim() === "") return "";
	const match = simplifiedMods.find((m) => m.humanNameMod.toLowerCase() === selectedName.toLowerCase() || m.modId.toLowerCase() === selectedName.toLowerCase());
	return match ? match.modId : selectedName;
});

const hasSpecialCollectibles = $derived.by(() => {
	if (!modStats) return false;
	const s = modStats.global.specialStrawberries;
	if (modStats.isVanilla) {
		return s.golden.current > 0 || s.moon.current > 0 || s.wingedGolden.current > 0;
	}
	return (
		s.golden.current > 0 ||
		s.golden.total > 0 ||
		s.moon.current > 0 ||
		s.moon.total > 0 ||
		s.wingedGolden.current > 0 ||
		s.wingedGolden.total > 0 ||
		s.silver.current > 0 ||
		s.silver.total > 0 ||
		s.rainbow.current > 0 ||
		s.rainbow.total > 0 ||
		s.platinum.current > 0 ||
		s.platinum.total > 0 ||
		s.speedTimers.total > 0
	);
});

$effect(() => {
	if (!selectedModId || selectedModId.trim() === "") {
		selectedEverestInfo = null;
		selectedMaddiesInfo = null;
		heroImage = null;
		bgColor = "#18181c";
		loadingInfo = false;
		return;
	}
	loadingInfo = true;
	localMods.MaddiesApi_Get_ModByModId(selectedModId).then((maddiesApiResult) => {
		selectedMaddiesInfo = maddiesApiResult;
		if (maddiesApiResult !== null) {
			loadingInfo = false;
			return;
		}

		localMods.EverestMods_Get_ModByModId(selectedModId).then((everestApiResult) => {
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
		bgColor = "#18181c";
		return;
	}

	const imgUrl = screenshots[0];
	heroImage = imgUrl;

	const img = new Image();
	img.crossOrigin = "anonymous";
	img.onload = () => {
		try {
			const color = getColorSync(img);
			if (!color) return;
			const { r, g, b } = color.rgb();
			bgColor = `rgb(${Math.round(r * 0.15)}, ${Math.round(g * 0.15)}, ${Math.round(b * 0.15)})`;
		} catch {
			bgColor = "#18181c";
		}
	};
	img.onerror = () => {
		bgColor = "#18181c";
	};
	img.src = imgUrl;
});

// Reactively load statistics when selectedModId or saveSlotStore.selectedSaveSlot changes
$effect(() => {
	const modId = selectedModId;
	const slot = saveSlotStore.selectedSaveSlot;

	if (!modId || modId.trim() === "") {
		modStats = null;
		loadingStats = false;
		return;
	}

	loadingStats = true;
	localMods
		.GetStatisticsByModId(modId, { saveSlot: slot })
		.then((res) => {
			modStats = res;
			loadingStats = false;
		})
		.catch((err: unknown) => {
			logger.error("ModView: Failed to load mod statistics", err);
			modStats = null;
			loadingStats = false;
		});
});

onMount(() => {
	localMods.EverestMods_Get_ListModSimplified().then((awaited: ModSimplified[]) => {
		simplifiedMods = awaited;
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

<div class="h-full overflow-y-auto">
  <div
    class="pointer-events-none absolute top-4 left-1/2 z-[100] w-auto max-w-[90%] -translate-x-1/2"
  >
		{#if showSearchBar}
			<SearchDynamic
				bind:selected={selectedName}
				limit={1000}
				searchOptions={{ caseSensitive: false, trimWhitespace: true }}
				bind:inputValue={searchQuery}
				placeholder="Busca el mod"
				bind:items={humanNamesList}
				class="w-full max-w-lg pointer-events-auto"
				overrideStyles={{ results: "mt-4 max-h-80 overflow-y-auto" }}
			/>
		{/if}
  </div>

  {#if selectedName}
    {#if loadingInfo}
      <p class="mt-8 text-zinc-400 px-6">Loading mod info...</p>
    {:else if selectedMaddiesInfo || selectedEverestInfo}
      <section class="w-full h-full" style:background={bgColor}>
        {#if heroImage}
          <div class="relative h-80 w-full overflow-hidden">
            <img
              src={heroImage}
              alt=""
              class="absolute inset-0 h-full w-full object-cover"
            />
            <div
              class="absolute inset-0"
              style:background={`linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.85) 90%, ${bgColor} 100%)`}
            ></div>
            <div class="absolute bottom-0 left-0 right-0 z-10 px-6 py-8">
              <h2 class="text-3xl font-bold drop-shadow-lg">
                {selectedMaddiesInfo?.Name ?? selectedEverestInfo?.humanName ?? selectedName}
              </h2>
              {#if selectedMaddiesInfo?.Author}
                <p class="mt-1 text-sm text-zinc-300">
                  by {selectedMaddiesInfo.Author}
                </p>
              {/if}
            </div>
          </div>
        {/if}

        <div class="min-h-[50vh]" style:background={bgColor}>
          <div class="mx-auto w-full space-y-8 px-6 py-8">
            {#if !heroImage}
              <h2 class="text-3xl font-bold">{selectedMaddiesInfo?.Name ?? selectedEverestInfo?.humanName ?? selectedName}</h2>
              {#if selectedMaddiesInfo?.Author}
                <p class="text-sm text-zinc-400">
                  by {selectedMaddiesInfo.Author}
                </p>
              {/if}
            {/if}

            {#if selectedMaddiesInfo?.Description}
              <p class="leading-relaxed text-zinc-200">
                {selectedMaddiesInfo.Description}
              </p>
            {/if}

            <!-- GLOBAL MOD STATISTICS SECTION -->
            <div class="rounded-2xl bg-zinc-950/40 border border-zinc-800/80 p-6 backdrop-blur-md space-y-6 w-full">
              <div class="border-b border-zinc-800/80 pb-3">
                <h3 class="text-xl font-bold text-white">
                  Mod Statistics (Global)
                </h3>
              </div>

              {#if loadingStats}
                <div class="py-8 text-center text-zinc-400 animate-pulse text-sm">
                  Loading gameplay statistics...
                </div>
              {:else if modStats}
                <!-- KEY METRICS GRID (PURE PNG IMAGE ASSETS, NO TEXT LABELS / EMOJIS, FULL WIDTH) -->
                <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 w-full items-stretch">
                  <!-- PLAY TIME -->
                  <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
                    <div class="mb-3">
                      <img src={timerIcon} alt="Play time" class="h-7 w-auto object-contain" />
                    </div>
                    <div class="text-2xl font-bold text-white">
                      {formatPlayTime(modStats.global.playTimeMs)}
                    </div>
                  </div>

                  <!-- DEATHS -->
                  <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
                    <div>
                      <div class="mb-3">
                        <img src={deathsIcon} alt="Deaths" class="h-7 w-auto object-contain" />
                      </div>
                      <div class="text-2xl font-bold text-white">
                        {modStats.global.deaths.toLocaleString()}
                      </div>
                    </div>
                    {#if modStats.global.minimumDeaths > 0}
                      <span class="inline-block mt-2 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">
                        Min: {modStats.global.minimumDeaths.toLocaleString()}
                      </span>
                    {/if}
                  </div>

                  <!-- RED STRAWBERRIES -->
                  <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
                    <div class="mb-3">
                      <img src={strawberryIcon} alt="Strawberries" class="h-7 w-auto object-contain" />
                    </div>
                    <div class="text-2xl font-bold text-white">
                      {modStats.global.redStrawberries.current}
                      {#if modStats.global.redStrawberries.total > 0}
                        <span class="text-sm font-normal text-zinc-400">/ {modStats.global.redStrawberries.total}</span>
                      {/if}
                    </div>
                  </div>

                  <!-- CRYSTAL HEARTS -->
                  <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
                    <div class="mb-3">
                      <img src={heartIcon} alt="Hearts" class="h-7 w-auto object-contain" />
                    </div>
                    <div class="text-2xl font-bold text-white">
                      {modStats.global.hearts.current}
                      {#if modStats.global.hearts.total > 0}
                        <span class="text-sm font-normal text-zinc-400">/ {modStats.global.hearts.total}</span>
                      {/if}
                    </div>
                  </div>

                  <!-- MINI HEARTS (shown for Collab/Lobby mods or when > 0) -->
                  {#if modStats.isLobbyMod || modStats.global.miniHearts.current > 0 || modStats.global.miniHearts.total > 0}
                    <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
                      <div class="mb-3">
                        <img src={miniHeartIcon} alt="Mini Hearts" class="h-7 w-auto object-contain" />
                      </div>
                      <div class="text-2xl font-bold text-white">
                        {modStats.global.miniHearts.current}
                        {#if modStats.global.miniHearts.total > 0}
                          <span class="text-sm font-normal text-zinc-400">/ {modStats.global.miniHearts.total}</span>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>

                <!-- SPECIAL COLLECTIBLES SECTION (CONDITIONAL - ONLY RENDERED IF NOT EMPTY) -->
                {#if hasSpecialCollectibles}
                  <div class="space-y-3 pt-2">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Special Collectibles</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
                      <!-- GOLDEN STRAWBERRIES -->
                      {#if modStats.isVanilla || modStats.global.specialStrawberries.golden.current > 0 || modStats.global.specialStrawberries.golden.total > 0}
                        <div class="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3">
                          <div class="mb-1.5">
                            <img src={goldenStrawberryIcon} alt="Golden Strawberry" class="h-6 w-auto object-contain" />
                          </div>
                          <div class="text-lg font-bold text-amber-200">
                            {modStats.global.specialStrawberries.golden.current}
                            {#if modStats.global.specialStrawberries.golden.total > 0}
                              <span class="text-xs font-normal text-amber-400/60">/ {modStats.global.specialStrawberries.golden.total}</span>
                            {/if}
                          </div>
                        </div>
                      {/if}

                      <!-- MOON BERRY -->
                      {#if modStats.isVanilla || modStats.global.specialStrawberries.moon.current > 0 || modStats.global.specialStrawberries.moon.total > 0}
                        <div class="bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-3">
                          <div class="text-[11px] font-semibold text-indigo-400 mb-1">
                            Moon Berry
                          </div>
                          <div class="text-lg font-bold text-indigo-200">
                            {modStats.global.specialStrawberries.moon.current}
                            {#if modStats.global.specialStrawberries.moon.total > 0}
                              <span class="text-xs font-normal text-indigo-400/60">/ {modStats.global.specialStrawberries.moon.total}</span>
                            {/if}
                          </div>
                        </div>
                      {/if}

                      <!-- WINGED GOLDEN BERRY -->
                      {#if modStats.isVanilla || modStats.global.specialStrawberries.wingedGolden.current > 0 || modStats.global.specialStrawberries.wingedGolden.total > 0}
                        <div class="bg-yellow-950/20 border border-yellow-500/20 rounded-lg p-3">
                          <div class="text-[11px] font-semibold text-yellow-400 mb-1">
                            Winged Golden
                          </div>
                          <div class="text-lg font-bold text-yellow-200">
                            {modStats.global.specialStrawberries.wingedGolden.current}
                            {#if modStats.global.specialStrawberries.wingedGolden.total > 0}
                              <span class="text-xs font-normal text-yellow-400/60">/ {modStats.global.specialStrawberries.wingedGolden.total}</span>
                            {/if}
                          </div>
                        </div>
                      {/if}

                      <!-- SILVER STRAWBERRIES (Only for Standalone/Lobby mods if > 0) -->
                      {#if !modStats.isVanilla && (modStats.global.specialStrawberries.silver.current > 0 || modStats.global.specialStrawberries.silver.total > 0)}
                        <div class="bg-slate-900/60 border border-slate-700/40 rounded-lg p-3">
                          <div class="text-[11px] font-semibold text-slate-300 mb-1">
                            Silver
                          </div>
                          <div class="text-lg font-bold text-slate-100">
                            {modStats.global.specialStrawberries.silver.current}
                            {#if modStats.global.specialStrawberries.silver.total > 0}
                              <span class="text-xs font-normal text-slate-400">/ {modStats.global.specialStrawberries.silver.total}</span>
                            {/if}
                          </div>
                        </div>
                      {/if}

                      <!-- RAINBOW BERRIES (Only for Standalone/Lobby mods if > 0) -->
                      {#if !modStats.isVanilla && (modStats.global.specialStrawberries.rainbow.current > 0 || modStats.global.specialStrawberries.rainbow.total > 0)}
                        <div class="bg-purple-950/20 border border-purple-500/20 rounded-lg p-3">
                          <div class="text-[11px] font-semibold text-purple-400 mb-1">
                            Rainbow
                          </div>
                          <div class="text-lg font-bold text-purple-200">
                            {modStats.global.specialStrawberries.rainbow.current}
                            {#if modStats.global.specialStrawberries.rainbow.total > 0}
                              <span class="text-xs font-normal text-purple-400/60">/ {modStats.global.specialStrawberries.rainbow.total}</span>
                            {/if}
                          </div>
                        </div>
                      {/if}

                      <!-- PLATINUM STRAWBERRIES (Only for Standalone/Lobby mods if > 0) -->
                      {#if !modStats.isVanilla && (modStats.global.specialStrawberries.platinum.current > 0 || modStats.global.specialStrawberries.platinum.total > 0)}
                        <div class="bg-teal-950/20 border border-teal-500/20 rounded-lg p-3">
                          <div class="text-[11px] font-semibold text-teal-300 mb-1">
                            Platinum
                          </div>
                          <div class="text-lg font-bold text-teal-100">
                            {modStats.global.specialStrawberries.platinum.current}
                            {#if modStats.global.specialStrawberries.platinum.total > 0}
                              <span class="text-xs font-normal text-teal-400/60">/ {modStats.global.specialStrawberries.platinum.total}</span>
                            {/if}
                          </div>
                        </div>
                      {/if}
                    </div>

                    <!-- SPEEDRUN MEDALS (Only if speedTimers.total > 0) -->
                    {#if !modStats.isVanilla && modStats.global.specialStrawberries.speedTimers.total > 0}
                      <div class="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 w-full">
                        <span class="text-xs font-semibold text-zinc-300">
                          Speedberry Medals:
                        </span>
                        <div class="flex items-center gap-3 text-xs font-semibold">
                          <span class="text-amber-400">Gold: {modStats.global.specialStrawberries.speedTimers.gold}</span>
                          <span class="text-slate-300">Silver: {modStats.global.specialStrawberries.speedTimers.silver}</span>
                          <span class="text-amber-600">Bronze: {modStats.global.specialStrawberries.speedTimers.bronze}</span>
                          <span class="text-zinc-500">Total: {modStats.global.specialStrawberries.speedTimers.total}</span>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- SAVE WIDE SUMMARY -->
                <div class="border-t border-zinc-800/60 pt-3 flex flex-wrap items-center justify-between text-xs text-zinc-400 w-full">
                  <span>Save Slot {modStats.saveSlot} Overview</span>
                  <div class="flex items-center gap-4">
                    <span>Total Save Dashes: <strong class="text-zinc-200">{modStats.saveWideDashes.toLocaleString()}</strong></span>
                    <span>Total Save Jumps: <strong class="text-zinc-200">{modStats.saveWideJumps.toLocaleString()}</strong></span>
                  </div>
                </div>
              {:else}
                <div class="py-6 text-center text-zinc-500 text-sm">
                  No save statistics found for Save Slot {saveSlotStore.selectedSaveSlot}
                </div>
              {/if}
            </div>

            {#if (selectedMaddiesInfo?.Screenshots?.length ?? 0) > 0 || (selectedMaddiesInfo?.MirroredScreenshots?.length ?? 0) > 0}
              <div>
                <h3 class="mb-3 text-lg font-semibold text-zinc-300">
                  Screenshots
                </h3>
                <HorizontalGallery
                  imageHeight="20rem"
                  maxRows={1}
                  images={selectedMaddiesInfo?.Screenshots?.length
                    ? selectedMaddiesInfo.Screenshots
                    : selectedMaddiesInfo?.MirroredScreenshots}
                />
              </div>
            {/if}
          </div>
        </div>
      </section>
    {:else}
      <p class="mt-8 text-zinc-500 px-6">Mod info not available</p>
    {/if}
  {/if}
</div>
