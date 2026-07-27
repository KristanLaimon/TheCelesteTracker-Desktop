<script lang="ts">
import { getColorSync } from "colorthief";
import { onMount } from "svelte";
import type { MaddiesApiModInfo } from "../../../api/MaddiesAPI";
import goldenStrawberryIcon from "../../../assets/interface_goldenstrawberry_icon.png";
import deathsIcon from "../../../assets/interface_SIDEA_deaths_icon.png";
import heartIcon from "../../../assets/interface_SIDEA_heart.png";
import miniHeartIcon from "../../../assets/interface_SIDEB_heart.png";
import strawberryIcon from "../../../assets/interface_strawberry_icon.png";
import timerIcon from "../../../assets/interface_timer_icon.png";
import HorizontalGallery from "../../../components/HorizontalGallery.svelte";
import SearchDynamic from "../../../components/SearchDynamic.svelte";
import type { EverestModInfo } from "../../../domain/Everest";
import type { ModSimplified, ModStatisticsResult } from "../../../domain/LocalMods";
import type { WithGLState } from "../../../libs/GoldenLayoutThemes/GoldenLayout.types";
import { DB_Mods as localMods } from "../../../setup";
import saveSlotStore from "../../../stores/SaveSlot.store.svelte";
import { logger } from "../../../utils/Logger";
import { formatPlayTime } from "../../../utils/Time";
import ModRecentSessionsTable from "./ModRecentSessionsTable.svelte";

type Props = { searchQuery: string; showSearchBar: boolean };

let { searchQuery = $bindable(""), onStateChange, showSearchBar = true }: WithGLState<Props> = $props();

let simplifiedMods = $state<ModSimplified[]>([]);
let humanNamesList = $derived(simplifiedMods.map((m) => m.humanNameMod));
let loadingInfo = $state(false);
let selectedName = $state<string>(searchQuery.toString());

let selectedEverestInfo = $state<EverestModInfo | null>(null);
let selectedMaddiesInfo = $state<MaddiesApiModInfo | null>(null);
let modStats = $state<ModStatisticsResult | null>(null);

let heroImage = $state<string | null>(null);
let bgColor = $state<string>("#18181c");

let loadingStats = $state(false);

const selectedModId = $derived.by(() => {
	if (!selectedName || selectedName.trim() === "") return "";
	const match = simplifiedMods.find((m) => m.humanNameMod.toLowerCase() === selectedName.toLowerCase() || m.modId.toLowerCase() === selectedName.toLowerCase());
	return match ? match.modId : selectedName;
});

const isMapMod = $derived<boolean>(selectedEverestInfo?.metadata?.isMapMod === true);

const hasSpecialCollectibles = $derived.by(() => {
	if (!isMapMod) return false;
	if (!modStats) return false;
	if (modStats.isVanilla) {
		const s = modStats.global.specialStrawberries;
		return s.golden.current > 0 || s.moon.current > 0 || s.wingedGolden.current > 0;
	}
	//Is mod (standalone or lobby)!
	const s = modStats.global.specialStrawberries;
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
	Promise.all([localMods.MaddiesApi_Get_ModByModId(selectedModId), localMods.EverestMods_Get_ModByModId(selectedModId)]).then(
		([maddiesApiResult, everestApiResult]) => {
			selectedMaddiesInfo = maddiesApiResult;
			selectedEverestInfo = everestApiResult;
			loadingInfo = false;
		},
	);
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

	if (!modId || modId.trim() === "" || !isMapMod) {
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
            {#if isMapMod}
              <div class="rounded-2xl bg-zinc-950/40 border border-zinc-800/80 p-5 backdrop-blur-md space-y-4 w-full">
                <div class="border-b border-zinc-800/80 pb-3">
                  <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Mod Statistics (Global)</span>
                  </h3>
                </div>

                {#if loadingStats}
                  <div class="py-6 text-center text-zinc-400 animate-pulse text-sm">
                    Loading gameplay statistics...
                  </div>
                {:else if modStats}
                  <!-- COMPACT HORIZONTAL BUTTON-LIKE PILLS ROW (ALWAYS SHOWING CURRENT / TOTAL) -->
                  <div class="flex flex-wrap items-center gap-3 w-full">
                    <!-- PLAY TIME -->
                    <div class="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-900/80 border border-zinc-800/80 rounded-xl shadow-sm hover:border-zinc-700/80 transition-all">
                      <img src={timerIcon} alt="Play time" class="h-5 w-auto object-contain" />
                      <span class="text-sm font-bold text-white">{formatPlayTime(modStats.global.playTimeMs)}</span>
                    </div>

                    <!-- DEATHS -->
                    <div class="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-900/80 border border-zinc-800/80 rounded-xl shadow-sm hover:border-zinc-700/80 transition-all">
                      <img src={deathsIcon} alt="Deaths" class="h-5 w-auto object-contain" />
                      <span class="text-sm font-bold text-white">{modStats.global.deaths.toLocaleString()}</span>
                      {#if modStats.global.minimumDeaths > 0}
                        <span class="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Min: {modStats.global.minimumDeaths.toLocaleString()}
                        </span>
                      {/if}
                    </div>

                    <!-- RED STRAWBERRIES -->
                    <div class="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-900/80 border border-zinc-800/80 rounded-xl shadow-sm hover:border-zinc-700/80 transition-all">
                      <img src={strawberryIcon} alt="Strawberries" class="h-5 w-auto object-contain" />
                      <span class="text-sm font-bold text-white">
                        {modStats.global.redStrawberries.current}
                        <span class="text-xs font-normal text-zinc-400">
                          / {modStats.global.redStrawberries.total > 0 ? modStats.global.redStrawberries.total : (modStats.isVanilla ? 175 : '?')}
                        </span>
                      </span>
                    </div>

                    <!-- CRYSTAL HEARTS -->
                    <div class="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-900/80 border border-zinc-800/80 rounded-xl shadow-sm hover:border-zinc-700/80 transition-all">
                      <img src={heartIcon} alt="Hearts" class="h-5 w-auto object-contain" />
                      <span class="text-sm font-bold text-white">
                        {modStats.global.hearts.current}
                        <span class="text-xs font-normal text-zinc-400">
                          / {modStats.global.hearts.total > 0 ? modStats.global.hearts.total : (modStats.isVanilla ? 24 : '?')}
                        </span>
                      </span>
                    </div>

                    <!-- MINI HEARTS -->
                    {#if !modStats.isVanilla}
                      {#if modStats.isLobbyMod || modStats.global.miniHearts.current > 0 || modStats.global.miniHearts.total > 0}
                        <div class="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-900/80 border border-zinc-800/80 rounded-xl shadow-sm hover:border-zinc-700/80 transition-all">
                          <img src={miniHeartIcon} alt="Mini Hearts" class="h-5 w-auto object-contain" />
                          <span class="text-sm font-bold text-white">
                            {modStats.global.miniHearts.current}
                            <span class="text-xs font-normal text-zinc-400">
                              / {modStats.global.miniHearts.total > 0 ? modStats.global.miniHearts.total : '?'}
                            </span>
                          </span>
                        </div>
                      {/if}
                    {/if}

                    <!-- SPECIAL COLLECTIBLES PILLS (CONDITIONAL) -->
                    {#if hasSpecialCollectibles}
                      <!-- GOLDEN STRAWBERRIES -->
                      {#if modStats.isVanilla || modStats.global.specialStrawberries.golden.current > 0 || modStats.global.specialStrawberries.golden.total > 0}
                        <div class="flex items-center gap-2.5 px-3.5 py-2 bg-amber-950/30 border border-amber-500/30 rounded-xl shadow-sm hover:border-amber-500/50 transition-all">
                          <img src={goldenStrawberryIcon} alt="Golden Strawberry" class="h-5 w-auto object-contain" />
                          <span class="text-sm font-bold text-amber-200">
                            {modStats.global.specialStrawberries.golden.current}
                            <span class="text-xs font-normal text-amber-400/60">
                              / {modStats.global.specialStrawberries.golden.total > 0 ? modStats.global.specialStrawberries.golden.total : (modStats.isVanilla ? 25 : '?')}
                            </span>
                          </span>
                        </div>
                      {/if}

                      <!-- MOON BERRY -->
                      {#if modStats.isVanilla || modStats.global.specialStrawberries.moon.current > 0 || modStats.global.specialStrawberries.moon.total > 0}
                        <div class="flex items-center gap-2 px-3 py-2 bg-indigo-950/30 border border-indigo-500/30 rounded-xl shadow-sm">
                          <span class="text-xs font-semibold text-indigo-400">Moon</span>
                          <span class="text-sm font-bold text-indigo-200">
                            {modStats.global.specialStrawberries.moon.current}
                            <span class="text-xs font-normal text-indigo-400/60">
                              / {modStats.global.specialStrawberries.moon.total > 0 ? modStats.global.specialStrawberries.moon.total : (modStats.isVanilla ? 1 : '?')}
                            </span>
                          </span>
                        </div>
                      {/if}

                      <!-- WINGED GOLDEN BERRY -->
                      {#if modStats.isVanilla || modStats.global.specialStrawberries.wingedGolden.current > 0 || modStats.global.specialStrawberries.wingedGolden.total > 0}
                        <div class="flex items-center gap-2 px-3 py-2 bg-yellow-950/30 border border-yellow-500/30 rounded-xl shadow-sm">
                          <span class="text-xs font-semibold text-yellow-400">Winged</span>
                          <span class="text-sm font-bold text-yellow-200">
                            {modStats.global.specialStrawberries.wingedGolden.current}
                            <span class="text-xs font-normal text-yellow-400/60">
                              / {modStats.global.specialStrawberries.wingedGolden.total > 0 ? modStats.global.specialStrawberries.wingedGolden.total : (modStats.isVanilla ? 1 : '?')}
                            </span>
                          </span>
                        </div>
                      {/if}

                      {#if !modStats.isVanilla}
                        <!-- SILVER STRAWBERRIES -->
                        {#if modStats.global.specialStrawberries.silver.current > 0 || modStats.global.specialStrawberries.silver.total > 0}
                          <div class="flex items-center gap-2 px-3 py-2 bg-slate-900/80 border border-slate-700/50 rounded-xl shadow-sm">
                            <span class="text-xs font-semibold text-slate-300">Silver</span>
                            <span class="text-sm font-bold text-slate-100">
                              {modStats.global.specialStrawberries.silver.current}
                              <span class="text-xs font-normal text-slate-400">
                                / {modStats.global.specialStrawberries.silver.total > 0 ? modStats.global.specialStrawberries.silver.total : '?'}
                              </span>
                            </span>
                          </div>
                        {/if}

                        <!-- RAINBOW BERRIES -->
                        {#if modStats.global.specialStrawberries.rainbow.current > 0 || modStats.global.specialStrawberries.rainbow.total > 0}
                          <div class="flex items-center gap-2 px-3 py-2 bg-purple-950/30 border border-purple-500/30 rounded-xl shadow-sm">
                            <span class="text-xs font-semibold text-purple-400">Rainbow</span>
                            <span class="text-sm font-bold text-purple-200">
                              {modStats.global.specialStrawberries.rainbow.current}
                              <span class="text-xs font-normal text-purple-400/60">
                                / {modStats.global.specialStrawberries.rainbow.total > 0 ? modStats.global.specialStrawberries.rainbow.total : '?'}
                              </span>
                            </span>
                          </div>
                        {/if}

                        <!-- PLATINUM STRAWBERRIES -->
                        {#if modStats.global.specialStrawberries.platinum.current > 0 || modStats.global.specialStrawberries.platinum.total > 0}
                          <div class="flex items-center gap-2 px-3 py-2 bg-teal-950/30 border border-teal-500/30 rounded-xl shadow-sm">
                            <span class="text-xs font-semibold text-teal-300">Platinum</span>
                            <span class="text-sm font-bold text-teal-100">
                              {modStats.global.specialStrawberries.platinum.current}
                              <span class="text-xs font-normal text-teal-400/60">
                                / {modStats.global.specialStrawberries.platinum.total > 0 ? modStats.global.specialStrawberries.platinum.total : '?'}
                              </span>
                            </span>
                          </div>
                        {/if}

                        <!-- SPEEDRUN MEDALS -->
                        {#if modStats.global.specialStrawberries.speedTimers.total > 0}
                          <div class="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300">
                            <span>Speedberries:</span>
                            <span class="text-amber-400">G: {modStats.global.specialStrawberries.speedTimers.gold}</span>
                            <span class="text-slate-300">S: {modStats.global.specialStrawberries.speedTimers.silver}</span>
                            <span class="text-amber-600">B: {modStats.global.specialStrawberries.speedTimers.bronze}</span>
                          </div>
                        {/if}
                      {/if}
                    {/if}
                  </div>
                {:else}
                  <div class="py-4 text-center text-zinc-500 text-sm">
                    No save statistics found for Save Slot {saveSlotStore.selectedSaveSlot}
                  </div>
                {/if}
              </div>
            {/if}

            <!-- SQLITE SESSION ANALYTICS & CHARTS SECTION -->
						<div class="space-y-8 w-full">
							<!-- RECENT SESSIONS TABLE -->
							<ModRecentSessionsTable modStringId={selectedModId} />
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
                    : selectedMaddiesInfo?.MirroredScreenshots ?? []}
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

