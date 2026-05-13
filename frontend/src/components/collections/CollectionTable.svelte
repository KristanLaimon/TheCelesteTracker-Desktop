<script lang="ts">
  import { GetCollectionStats, GetIndexedAssetAsBase64 } from '../../../wailsjs/go/main/App';
  import type { src } from '../../../wailsjs/go/models';
  import { saveStore } from '../../lib/saveStore.svelte';
  import { getAssetUrl } from '../../lib/assetHelper';
  import defaultLevelLogo from '../../assets/level_logo_moddedleveldefault.png';
  import deathIcon from '../../assets/interface_SIDEA_deaths_icon.png';
  import heartIcon from '../../assets/interface_SIDEA_heart.png';
  import strawberryIcon from '../../assets/interface_strawberry_icon.png';
  import goldenStrawberryIcon from '../../assets/interface_goldenstrawberry_icon.png';
  import timerIcon from '../../assets/interface_timer_icon.png';
  import IconBolt from '~icons/material-symbols/bolt';
  import IconFlag from '~icons/material-symbols/flag';
  import IconDirectionsRun from '~icons/material-symbols/directions-run';
  import IconSkull from '~icons/material-symbols/skull';
  import IconFavorite from '~icons/material-symbols/favorite';

  import {
    Assets_Vanilla_ChapterIcon,
    Assets_Vanilla_DeathIcons,
    Assets_Vanilla_SideIcon,
  } from '../../lib/assets';

  interface Props {
    campaignIds?: number[];
  }

  let { campaignIds = [] }: Props = $props();

  type LevelStats = src.LevelCollectionStats & {
    iconData?: string | null;
  };

  type Totals = {
    totalTime: number;
    strawberries: number;
    maxStrawberries: number;
    goldenStrawberries: number;
    hearts: number;
    maxHearts: number;
    deaths: number;
    fewestDeaths: number;
    dashes: number;
    jumps: number;
    sides: number;
    chapters: number;
  };

  type CampaignGroup = {
    id: number;
    name: string;
    displayName: string;
    bannerData?: string | null;
    coverData?: string | null;
    levels: LevelStats[];
    totals: Totals;
  };

  type LobbyGroup = {
    id: number | 'no-lobby';
    name: string;
    campaigns: CampaignGroup[];
    totals: Totals;
  };

  let lobbyGroups = $state<LobbyGroup[]>([]);
  let loading = $state(false);
  let errorMessage = $state('');

  const summaryStats = [
    { key: 'totalTime', label: 'Total Time', image: timerIcon, color: 'text-white', format: (totals: Totals) => formatTime(totals.totalTime) },
    { key: 'berries', label: 'Berries', image: strawberryIcon, color: 'text-tertiary', format: (totals: Totals) => `${totals.strawberries}/${totals.maxStrawberries}` },
    { key: 'hearts', label: 'Hearts', image: heartIcon, color: 'text-purple-400', format: (totals: Totals) => `${totals.hearts}/${totals.maxHearts}` },
    { key: 'deaths', label: 'Deaths', image: deathIcon, color: 'text-primary', format: (totals: Totals) => totals.deaths.toLocaleString() },
    { key: 'dashes', label: 'Dashes', icon: IconBolt, color: 'text-secondary', format: (totals: Totals) => totals.dashes.toLocaleString() },
    { key: 'sides', label: 'Sides', icon: IconFlag, color: 'text-yellow-400', format: (totals: Totals) => totals.sides.toLocaleString() },
  ];

  const campaignSummaryStats = [
    { key: 'totalTime', label: 'Total Time', image: timerIcon, color: 'text-white', format: (totals: Totals) => formatTime(totals.totalTime) },
    { key: 'berries', label: 'Berries', image: strawberryIcon, color: 'text-tertiary', format: (totals: Totals) => `${totals.strawberries}/${totals.maxStrawberries}` },
    { key: 'hearts', label: 'Hearts', image: heartIcon, color: 'text-purple-400', format: (totals: Totals) => totals.hearts.toLocaleString() },
    { key: 'maxHearts', label: 'Max', image: heartIcon, color: 'text-purple-300', format: (totals: Totals) => totals.maxHearts.toLocaleString() },
    { key: 'deaths', label: 'Deaths', image: deathIcon, color: 'text-primary', format: (totals: Totals) => totals.deaths.toLocaleString() },
    { key: 'fewestDeaths', label: 'Fewest', image: deathIcon, color: 'text-red-200', format: (totals: Totals) => totals.fewestDeaths.toLocaleString() },
    { key: 'dashes', label: 'Dashes', icon: IconBolt, color: 'text-secondary', format: (totals: Totals) => totals.dashes.toLocaleString() },
    { key: 'jumps', label: 'Jumps', icon: IconDirectionsRun, color: 'text-zinc-300', format: (totals: Totals) => totals.jumps.toLocaleString() },
    { key: 'sides', label: 'Sides', icon: IconFlag, color: 'text-yellow-400', format: (totals: Totals) => totals.sides.toLocaleString() },
  ];

  const emptyTotals = (): Totals => ({
    totalTime: 0,
    strawberries: 0,
    maxStrawberries: 0,
    goldenStrawberries: 0,
    hearts: 0,
    maxHearts: 0,
    deaths: 0,
    fewestDeaths: 0,
    dashes: 0,
    jumps: 0,
    sides: 0,
    chapters: 0,
  });

  function addLevelTotals(totals: Totals, level: LevelStats) {
    totals.totalTime += level.totalTime || 0;
    totals.strawberries += level.strawberries || 0;
    totals.maxStrawberries += level.maxStrawberries || 0;
    totals.goldenStrawberries += level.goldenStrawberries || 0;
    totals.hearts += level.hearts || 0;
    totals.maxHearts += level.maxHearts || 0;
    totals.deaths += level.deaths || 0;
    totals.dashes += level.dashes || 0;
    totals.jumps += level.jumps || 0;
    totals.sides += 1;
    if (level.fewestDeaths > 0) {
      totals.fewestDeaths = totals.fewestDeaths === 0 ? level.fewestDeaths : Math.min(totals.fewestDeaths, level.fewestDeaths);
    }
  }

  async function loadStats() {
    if (!campaignIds.length) {
      lobbyGroups = [];
      loading = false;
      return;
    }

    loading = true;
    errorMessage = '';

    try {
      const fetchedStats: LevelStats[] = await GetCollectionStats(campaignIds, saveStore.saveDataId || null);
      const pathsToLoad = new Set<string>();

      for (const stat of fetchedStats) {
        if (stat.coverImgPath) pathsToLoad.add(stat.coverImgPath);
        if (stat.iconImgPath) pathsToLoad.add(stat.iconImgPath);
        if (stat.endscreenImgPath) pathsToLoad.add(stat.endscreenImgPath);
      }

      const loadedAssets = new Map<string, string>();
      await Promise.all([...pathsToLoad].map(async (path) => {
        const url = await loadCollectionAsset(path);
        if (url) loadedAssets.set(path, url);
      }));

      const grouped = new Map<number | 'no-lobby', LobbyGroup>();
      const chapterSets = new Map<number | 'no-lobby', Set<string>>();
      const campaignChapterSets = new Map<number, Set<string>>();

      for (const stat of fetchedStats) {
        const lobbyId = stat.lobbyId ?? 'no-lobby';
        const lobbyName = stat.lobbyName ?? 'Individual Campaigns';
        let lobby = grouped.get(lobbyId);

        if (!lobby) {
          lobby = { id: lobbyId, name: lobbyName, campaigns: [], totals: emptyTotals() };
          grouped.set(lobbyId, lobby);
          chapterSets.set(lobbyId, new Set());
        }

        let campaign = lobby.campaigns.find((item) => item.id === stat.campaignId);
        if (!campaign) {
          const bannerPath = findCampaignBannerPath(fetchedStats, stat.campaignId);
          campaign = {
            id: stat.campaignId,
            name: stat.campaignName,
            displayName: getCampaignDisplayName(stat.campaignName),
            bannerData: bannerPath ? loadedAssets.get(bannerPath) ?? null : null,
            coverData: stat.coverImgPath ? loadedAssets.get(stat.coverImgPath) ?? null : null,
            levels: [],
            totals: emptyTotals(),
          };
          lobby.campaigns.push(campaign);
          campaignChapterSets.set(campaign.id, new Set());
        }

        const levelWithIcon: LevelStats = {
          ...stat,
          iconData: stat.iconImgPath ? loadedAssets.get(stat.iconImgPath) ?? null : null,
        };

        campaign.levels.push(levelWithIcon);
        addLevelTotals(campaign.totals, levelWithIcon);
        addLevelTotals(lobby.totals, levelWithIcon);
        chapterSets.get(lobbyId)?.add(levelWithIcon.levelName);
        campaignChapterSets.get(campaign.id)?.add(levelWithIcon.levelName);
      }

      for (const lobby of grouped.values()) {
        lobby.totals.chapters = chapterSets.get(lobby.id)?.size ?? 0;
        for (const campaign of lobby.campaigns) {
          campaign.totals.chapters = campaignChapterSets.get(campaign.id)?.size ?? 0;
          campaign.levels.sort((a, b) => a.levelName.localeCompare(b.levelName) || a.levelSide.localeCompare(b.levelSide));
        }
      }

      lobbyGroups = [...grouped.values()];
    } catch (error) {
      console.error('Failed to load collection stats:', error);
      errorMessage = 'Collection stats could not be loaded.';
      lobbyGroups = [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void loadStats();
  });

  function formatTime(ms: number) {
    if (!ms) return '0:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async function loadCollectionAsset(path: string) {
    if (!path) return null;
    if (!path.includes('/') && !path.includes('\\')) {
      try {
        return await GetIndexedAssetAsBase64(path);
      } catch (error) {
        console.warn(`Could not load indexed collection asset ${path}`, error);
        return null;
      }
    }
    return getAssetUrl(path);
  }

  function findCampaignBannerPath(stats: LevelStats[], campaignId: number) {
    return stats.find((stat) => stat.campaignId === campaignId && stat.endscreenImgPath)?.endscreenImgPath || null;
  }

  function titleCaseFromId(value: string) {
    return value
      .replace(/__/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Za-z])(\d)/g, '$1 $2')
      .replace(/(\d)([A-Za-z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getCampaignDisplayName(campaignName: string) {
    const parts = campaignName.split('/').map((part) => part.trim()).filter(Boolean);
    const name = parts.at(-1) || campaignName;
    return titleCaseFromId(name);
  }

  function getLevelDisplayName(level: LevelStats) {
    if (level.chapterName && level.chapterName !== level.levelName) return level.chapterName;
    const parts = level.levelName.split('/').filter(Boolean);
    return titleCaseFromId(parts.at(-1) || level.levelName);
  }

  function getLevelIcon(level: LevelStats) {
    if (level.iconData) return level.iconData;
    const logo = Assets_Vanilla_ChapterIcon[level.chapterName] || Assets_Vanilla_ChapterIcon[level.levelName];
    if (!logo) return defaultLevelLogo.src;
    return typeof logo === 'string' ? logo : logo.src;
  }

  function getSideIcon(side: string) {
    const icon = Assets_Vanilla_SideIcon[side];
    if (!icon) return null;
    return typeof icon === 'string' ? icon : icon.src;
  }

  function getDeathIcon(side: string) {
    const icon = Assets_Vanilla_DeathIcons[side] || deathIcon;
    if (!icon) return null;
    return typeof icon === 'string' ? icon : icon.src;
  }

  function getStatus(level: LevelStats) {
    const cleared = level.totalTime > 0 || level.hearts > 0 || level.strawberries > 0;
    const allBerries = level.maxStrawberries > 0 && level.strawberries >= level.maxStrawberries;
    const hasHeart = level.hearts >= 1;
    const golden = level.goldenStrawberries >= 1;

    if (golden && allBerries && hasHeart) return { label: 'Golden Full Clear', className: 'bg-yellow-400 text-black' };
    if (golden) return { label: 'Golden Clear', className: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30' };
    if (allBerries && hasHeart) return { label: 'Full Clear', className: 'bg-cyan-400/15 text-cyan-200 border border-cyan-400/30' };
    if (cleared) return { label: 'Clear', className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' };
    return { label: 'Not Clear', className: 'bg-zinc-800 text-zinc-500 border border-zinc-700' };
  }

  const columns: Array<{ label: string; align: 'left' | 'center'; image?: { src: string }; icon?: unknown; color?: string }> = [
    { label: 'Status', align: 'center' },
    { label: 'Name', align: 'left' },
    { label: 'Berries', align: 'center', image: strawberryIcon },
    { label: 'Max', align: 'center', image: strawberryIcon },
    { label: 'Golden', align: 'center', image: goldenStrawberryIcon },
    { label: 'Total Time', align: 'center', image: timerIcon },
    { label: 'Hearts', align: 'center', image: heartIcon },
    { label: 'Max', align: 'center', image: heartIcon },
    { label: 'Deaths', align: 'center', image: deathIcon },
    { label: 'Fewest', align: 'center', image: deathIcon },
    { label: 'Dashes', align: 'center', icon: IconBolt, color: 'text-secondary' },
    { label: 'Jumps', align: 'center', icon: IconDirectionsRun, color: 'text-zinc-400' },
  ];
</script>

<div class="space-y-6">
  {#if loading && lobbyGroups.length === 0}
    <div class="border border-outline-muted bg-card-bg rounded-xl p-8 text-center text-zinc-500 font-medium">
      Loading collection stats...
    </div>
  {:else if errorMessage}
    <div class="border border-red-500/30 bg-red-500/10 rounded-xl p-8 text-center text-red-200 font-medium">
      {errorMessage}
    </div>
  {:else if lobbyGroups.length === 0}
    <div class="border border-outline-muted bg-card-bg rounded-xl p-8 text-center text-zinc-500 font-medium">
      No campaign data available for this collection.
    </div>
  {:else}
    {#each lobbyGroups as lobby (lobby.id)}
      <section class="space-y-4">
        {#if lobby.id !== 'no-lobby'}
          <div class="flex items-center justify-between gap-4 border border-outline-muted bg-zinc-950/60 rounded-xl px-5 py-4">
            <div>
              <p class="text-[11px] uppercase tracking-widest text-primary font-bold">Lobby</p>
              <h2 class="text-2xl font-headline font-bold text-white">{lobby.name}</h2>
            </div>
            <div class="flex gap-4 text-right text-xs text-zinc-500 font-bold uppercase tracking-widest">
              <div><span class="block text-lg text-white font-pixel">{lobby.totals.chapters}</span>Chapters</div>
              <div><span class="block text-lg text-white font-pixel">{lobby.totals.sides}</span>Sides</div>
              <div><span class="block text-lg text-white font-pixel">{formatTime(lobby.totals.totalTime)}</span>Time</div>
            </div>
          </div>
        {/if}

        {#each lobby.campaigns as campaign (campaign.id)}
          <section class="border border-outline-muted bg-card-bg rounded-xl overflow-hidden">
            <div class="relative min-h-48 bg-zinc-950 overflow-hidden">
              {#if campaign.bannerData}
                <img src={campaign.bannerData} alt="" class="absolute inset-0 w-full h-full object-cover opacity-75" />
              {/if}
              <div class="absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/65 to-zinc-950/20"></div>
              <div class="relative z-10 min-h-48 p-6 flex flex-col justify-end gap-5">
                <div class="min-w-0">
                  <p class="text-[11px] uppercase tracking-widest text-primary font-bold truncate">{campaign.name}</p>
                  <h3 class="text-3xl font-headline font-black text-white tracking-tight truncate">{campaign.displayName}</h3>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-9 gap-2 max-w-6xl">
                  {#each campaignSummaryStats as stat (stat.key)}
                    <div class="bg-zinc-950/75 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 min-w-0">
                      {#if stat.image}
                        <img src={stat.image.src} alt="" class="w-5 h-5 object-contain opacity-85 shrink-0" />
                      {:else if stat.icon}
                        <stat.icon class="text-xl shrink-0 {stat.color}" />
                      {/if}
                      <div class="min-w-0">
                        <p class="text-[9px] uppercase tracking-widest text-zinc-500 font-bold truncate">{stat.label}</p>
                        <p class="font-pixel text-[11px] {stat.color} truncate mt-0.5">{stat.format(campaign.totals)}</p>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <div>
              <div class="hidden xl:grid chapter-grid border-y border-outline-muted bg-zinc-900 px-3 py-3">
                {#each columns as column, index (column + index)}
                  <div class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold {column.align === 'left' ? 'text-left' : 'text-center'}">
                    <span class="inline-flex items-center gap-1.5 {column.align === 'left' ? 'justify-start' : 'justify-center'}">
                      {#if column.image}
                        <img src={column.image.src} alt="" class="w-4 h-4 object-contain opacity-70" />
                      {:else if column.icon}
                        <column.icon class="text-base {column.color || 'text-zinc-500'}" />
                      {/if}
                      {column.label}
                    </span>
                  </div>
                {/each}
              </div>

              <div class="divide-y divide-outline-muted/50">
                {#each campaign.levels as level (campaign.id + level.levelName + level.levelSide)}
                  {@const status = getStatus(level)}
                  {@const sideIcon = getSideIcon(level.levelSide)}
                  {@const levelDeathIcon = getDeathIcon(level.levelSide)}
                  <div class="chapter-row hover:bg-white/5 transition-colors">
                    <div class="chapter-status">
                      <span class="inline-flex justify-center px-2 py-1 rounded text-[10px] xl:text-[11px] font-bold uppercase tracking-tight {status.className}">
                        {status.label}
                      </span>
                    </div>

                    <div class="chapter-name">
                      <div class="w-10 h-10 xl:w-11 xl:h-11 rounded-lg bg-zinc-800/70 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={getLevelIcon(level)} alt="" class="w-10 h-10 xl:w-11 xl:h-11 object-contain drop-shadow-[0_5px_12px_rgba(0,0,0,0.45)]" />
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-zinc-100 truncate text-sm xl:text-base">{getLevelDisplayName(level)}</div>
                        <div class="flex items-center gap-2 mt-1">
                          {#if sideIcon}
                            <img src={sideIcon} alt="" class="w-5 h-5 object-contain" />
                          {/if}
                          <span class="text-[10px] font-bold text-zinc-500 uppercase">{level.levelSide}</span>
                        </div>
                      </div>
                    </div>

                    <div class="stat-cell text-zinc-300"><img src={strawberryIcon.src} alt="" />{level.strawberries}</div>
                    <div class="stat-cell text-zinc-400"><img src={strawberryIcon.src} alt="" class="opacity-50" />{level.maxStrawberries}</div>
                    <div class="stat-cell text-yellow-300"><img src={goldenStrawberryIcon.src} alt="" />{level.goldenStrawberries}</div>
                    <div class="stat-cell text-zinc-300"><img src={timerIcon.src} alt="" class="opacity-70" />{formatTime(level.totalTime)}</div>
                    <div class="stat-cell text-pink-300">
                      {#if sideIcon}<img src={sideIcon} alt="" />{:else}<IconFavorite class="text-lg" />{/if}
                      {level.hearts}
                    </div>
                    <div class="stat-cell text-zinc-400">
                      {#if sideIcon}<img src={sideIcon} alt="" class="opacity-60" />{:else}<IconFavorite class="text-lg opacity-70" />{/if}
                      {level.maxHearts}
                    </div>
                    <div class="stat-cell text-red-300">
                      {#if levelDeathIcon}<img src={levelDeathIcon} alt="" />{:else}<IconSkull class="text-lg" />{/if}
                      {level.deaths}
                    </div>
                    <div class="stat-cell text-zinc-400">
                      {#if levelDeathIcon}<img src={levelDeathIcon} alt="" class="opacity-60" />{:else}<IconSkull class="text-lg opacity-70" />{/if}
                      {level.fewestDeaths}
                    </div>
                    <div class="stat-cell text-cyan-300"><IconBolt class="text-xl" />{level.dashes}</div>
                    <div class="stat-cell text-zinc-400"><IconDirectionsRun class="text-lg" />{level.jumps}</div>
                  </div>
                {/each}
              </div>
            </div>
          </section>
        {/each}
      </section>
    {/each}
  {/if}
</div>

<style>
  .chapter-grid {
    grid-template-columns:
      minmax(5.2rem, 0.58fr)
      minmax(11rem, 1.55fr)
      repeat(3, minmax(3.1rem, 0.48fr))
      minmax(5.8rem, 0.72fr)
      repeat(6, minmax(3.1rem, 0.48fr));
    align-items: center;
    gap: 0.35rem;
  }

  .chapter-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 0.9rem;
  }

  .chapter-status {
    display: flex;
    align-items: center;
  }

  .chapter-name {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.75rem;
  }

  .stat-cell {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    justify-content: flex-start;
    gap: 0.35rem;
    font-family: var(--font-pixel);
    font-size: 0.68rem;
    white-space: nowrap;
  }

  .stat-cell img {
    width: 1.25rem;
    height: 1.25rem;
    object-fit: contain;
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    .chapter-row {
      grid-template-columns: minmax(7rem, 1fr) repeat(4, minmax(4rem, 0.7fr));
      align-items: center;
    }

    .chapter-name {
      grid-column: 1 / -1;
    }
  }

  @media (min-width: 1280px) {
    .chapter-row {
      grid-template-columns:
        minmax(5.2rem, 0.58fr)
        minmax(11rem, 1.55fr)
        repeat(3, minmax(3.1rem, 0.48fr))
        minmax(5.8rem, 0.72fr)
        repeat(6, minmax(3.1rem, 0.48fr));
      gap: 0.35rem;
      padding: 0.75rem;
      align-items: center;
    }

    .chapter-status,
    .stat-cell {
      justify-content: center;
    }

    .chapter-name {
      grid-column: auto;
    }
  }
</style>
