<script lang="ts">
  import { GetCollectionStats, GetIndexedAssetAsBase64, UpdateChapterSideStats } from '../../../wailsjs/go/main/App';
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
  import IconEdit from '~icons/material-symbols/edit';
  import IconSave from '~icons/material-symbols/save';
  import IconClose from '~icons/material-symbols/close';

  import {
    Assets_Vanilla_ChapterIcon,
    Assets_Vanilla_DeathIcons,
    Assets_Vanilla_SideIcon,
  } from '../../lib/assets';

  interface Props {
    campaignIds?: number[];
    onStatsChanged?: () => void | Promise<void>;
  }

  let { campaignIds = [], onStatsChanged }: Props = $props();

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
  let isEditing = $state(false);
  let savingStats = $state(false);
  let draftStats = $state<Record<string, EditableStats>>({});
  let goldenFullClearPulse = $state(false);

  type EditableStats = {
    totalTimeText: string;
    strawberries: number;
    maxStrawberries: number;
    goldenStrawberries: number;
    hearts: number;
    maxHearts: number;
    deaths: number;
    fewestDeaths: number;
    dashes: number;
    jumps: number;
  };

  const goldenFullClearPulseMinMs = 3000;
  const goldenFullClearPulseMaxMs = 12000;
  const goldenFullClearPulseDurationMs = 820;

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
    { key: 'hearts', label: 'Hearts', image: heartIcon, color: 'text-purple-400', format: (totals: Totals) => `${totals.hearts}/${totals.maxHearts}` },
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

  function recalculateTotals() {
    for (const lobby of lobbyGroups) {
      lobby.totals = emptyTotals();
      const lobbyChapters = new Set<string>();

      for (const campaign of lobby.campaigns) {
        campaign.totals = emptyTotals();
        const campaignChapters = new Set<string>();

        for (const level of campaign.levels) {
          addLevelTotals(campaign.totals, level);
          addLevelTotals(lobby.totals, level);
          campaignChapters.add(level.levelName);
          lobbyChapters.add(level.levelName);
        }

        campaign.totals.chapters = campaignChapters.size;
      }

      lobby.totals.chapters = lobbyChapters.size;
    }

    lobbyGroups = [...lobbyGroups];
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
      isEditing = false;
      draftStats = {};
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

  $effect(() => {
    let pulseTimeout: ReturnType<typeof setTimeout>;
    let resetTimeout: ReturnType<typeof setTimeout>;

    const getNextPulseDelay = () =>
      goldenFullClearPulseMinMs + Math.random() * (goldenFullClearPulseMaxMs - goldenFullClearPulseMinMs);

    const schedulePulse = () => {
      pulseTimeout = setTimeout(() => {
        goldenFullClearPulse = true;
        resetTimeout = setTimeout(() => {
          goldenFullClearPulse = false;
          schedulePulse();
        }, goldenFullClearPulseDurationMs);
      }, getNextPulseDelay());
    };

    schedulePulse();

    return () => {
      clearTimeout(pulseTimeout);
      clearTimeout(resetTimeout);
    };
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
    const berriesComplete = level.maxStrawberries === 0 || level.strawberries >= level.maxStrawberries;
    const heartsComplete = level.maxHearts === 0 || level.hearts >= level.maxHearts;
    const hasFullClearGoal = level.maxStrawberries > 0 || level.maxHearts > 0;
    const fullClear = hasFullClearGoal && berriesComplete && heartsComplete;
    const golden = level.goldenStrawberries >= 1;

    if (golden && fullClear) return { label: 'Golden Full Clear', className: 'status-golden-full-clear' };
    if (golden) return { label: 'Golden Clear', className: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30' };
    if (fullClear) return { label: 'Full Clear', className: 'bg-cyan-400/15 text-cyan-200 border border-cyan-400/30' };
    if (cleared) return { label: 'Clear', className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' };
    return { label: 'Not Clear', className: 'bg-zinc-800 text-zinc-500 border border-zinc-700' };
  }

  function rowKey(level: LevelStats) {
    return `${level.levelName}:${level.levelSide}`;
  }

  function formatTimeForInput(ms: number) {
    return formatTime(ms);
  }

  function parseTimeInput(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return 0;

    const parts = trimmed.split(':').map((part) => Number(part));
    if (parts.some((part) => Number.isNaN(part) || part < 0)) return 0;

    if (parts.length === 1) return Math.floor(parts[0] * 1000);
    if (parts.length === 2) return Math.floor(((parts[0] * 60) + parts[1]) * 1000);

    const seconds = parts.at(-1) ?? 0;
    const minutes = parts.at(-2) ?? 0;
    const hours = parts.slice(0, -2).reduce((total, part) => (total * 60) + part, 0);
    return Math.floor(((hours * 3600) + (minutes * 60) + seconds) * 1000);
  }

  function createDraft(level: LevelStats): EditableStats {
    return {
      totalTimeText: formatTimeForInput(level.totalTime),
      strawberries: level.strawberries,
      maxStrawberries: level.maxStrawberries,
      goldenStrawberries: level.goldenStrawberries >= 1 ? 1 : 0,
      hearts: level.hearts,
      maxHearts: level.maxHearts,
      deaths: level.deaths,
      fewestDeaths: level.fewestDeaths,
      dashes: level.dashes,
      jumps: level.jumps,
    };
  }

  function resetDrafts() {
    const nextDrafts: Record<string, EditableStats> = {};

    for (const lobby of lobbyGroups) {
      for (const campaign of lobby.campaigns) {
        for (const level of campaign.levels) {
          nextDrafts[rowKey(level)] = createDraft(level);
        }
      }
    }

    draftStats = nextDrafts;
  }

  function startEditing() {
    resetDrafts();
    isEditing = true;
  }

  function cancelEditing() {
    draftStats = {};
    isEditing = false;
  }

  function updateDraft(level: LevelStats, key: keyof EditableStats, value: string | number | boolean) {
    const id = rowKey(level);
    const current = draftStats[id] ?? createDraft(level);
    const next = { ...current };

    if (key === 'totalTimeText') {
      next.totalTimeText = String(value);
    } else if (key === 'goldenStrawberries') {
      next.goldenStrawberries = value ? 1 : 0;
    } else {
      next[key] = Math.max(0, Math.floor(Number(value) || 0));
    }

    draftStats = { ...draftStats, [id]: normalizeDraft(next) };
  }

  function normalizeDraft(draft: EditableStats) {
    const next = { ...draft };
    next.maxStrawberries = Math.max(0, next.maxStrawberries);
    next.strawberries = Math.min(Math.max(0, next.strawberries), next.maxStrawberries);
    next.goldenStrawberries = next.goldenStrawberries >= 1 ? 1 : 0;
    next.maxHearts = Math.max(0, next.maxHearts);
    next.hearts = Math.min(Math.max(0, next.hearts), next.maxHearts);
    next.deaths = Math.max(0, next.deaths);
    next.fewestDeaths = Math.min(Math.max(0, next.fewestDeaths), next.deaths);
    next.dashes = Math.max(0, next.dashes);
    next.jumps = Math.max(0, next.jumps);
    return next;
  }

  function hasDraftChanged(level: LevelStats, draft: EditableStats) {
    return parseTimeInput(draft.totalTimeText) !== level.totalTime
      || draft.strawberries !== level.strawberries
      || draft.maxStrawberries !== level.maxStrawberries
      || draft.goldenStrawberries !== (level.goldenStrawberries >= 1 ? 1 : 0)
      || draft.hearts !== level.hearts
      || draft.maxHearts !== level.maxHearts
      || draft.deaths !== level.deaths
      || draft.fewestDeaths !== level.fewestDeaths
      || draft.dashes !== level.dashes
      || draft.jumps !== level.jumps;
  }

  async function saveDrafts() {
    if (!isUpdateChapterSideStatsAvailable()) {
      errorMessage = 'Table edits could not be saved: restart the Wails desktop app so the new save method is available.';
      return;
    }

    const updates: Array<{ level: LevelStats; draft: EditableStats }> = [];

    for (const lobby of lobbyGroups) {
      for (const campaign of lobby.campaigns) {
        for (const level of campaign.levels) {
          const draft = normalizeDraft(draftStats[rowKey(level)] ?? createDraft(level));
          if (hasDraftChanged(level, draft)) updates.push({ level, draft });
        }
      }
    }

    if (updates.length === 0) {
      cancelEditing();
      return;
    }

    savingStats = true;
    errorMessage = '';

    try {
      await Promise.all(updates.map(({ level, draft }) => UpdateChapterSideStats({
        chapterSid: level.levelName,
        sideId: level.levelSide,
        totalTime: parseTimeInput(draft.totalTimeText),
        strawberries: draft.strawberries,
        maxStrawberries: draft.maxStrawberries,
        goldenStrawberries: draft.goldenStrawberries,
        hearts: draft.hearts,
        maxHearts: draft.maxHearts,
        deaths: draft.deaths,
        fewestDeaths: draft.fewestDeaths,
        dashes: draft.dashes,
        jumps: draft.jumps,
      })));

      for (const { level, draft } of updates) {
        level.totalTime = parseTimeInput(draft.totalTimeText);
        level.strawberries = draft.strawberries;
        level.maxStrawberries = draft.maxStrawberries;
        level.goldenStrawberries = draft.goldenStrawberries;
        level.hearts = draft.hearts;
        level.maxHearts = draft.maxHearts;
        level.deaths = draft.deaths;
        level.fewestDeaths = draft.fewestDeaths;
        level.dashes = draft.dashes;
        level.jumps = draft.jumps;
      }

      recalculateTotals();
      draftStats = {};
      isEditing = false;
      await onStatsChanged?.();
    } catch (error) {
      console.error('Failed to update table stats:', error);
      errorMessage = `Table edits could not be saved: ${getErrorMessage(error)}`;
    } finally {
      savingStats = false;
    }
  }

  function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
  }

  function isUpdateChapterSideStatsAvailable() {
    return typeof window !== 'undefined'
      && typeof window.go?.main?.App?.UpdateChapterSideStats === 'function';
  }

  const columns: Array<{ label: string; align: 'left' | 'center'; image?: { src: string }; icon?: unknown; color?: string }> = [
    { label: 'Status', align: 'center' },
    { label: 'Name', align: 'left' },
    { label: 'Berries', align: 'center', image: strawberryIcon },
    { label: 'Golden', align: 'center', image: goldenStrawberryIcon },
    { label: 'Total Time', align: 'center', image: timerIcon },
    { label: 'Hearts', align: 'center', image: heartIcon },
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
    <div class="flex justify-end gap-2">
      {#if isEditing}
        <button
          type="button"
          class="table-action-button table-action-button-primary"
          disabled={savingStats}
          title="Save table edits"
          onclick={saveDrafts}
        >
          <IconSave />
          <span>{savingStats ? 'Saving' : 'Save'}</span>
        </button>
        <button
          type="button"
          class="table-action-button"
          disabled={savingStats}
          title="Cancel table edits"
          onclick={cancelEditing}
        >
          <IconClose />
          <span>Cancel</span>
        </button>
      {:else}
        <button
          type="button"
          class="table-icon-button"
          title="Edit table"
          aria-label="Edit table"
          onclick={startEditing}
        >
          <IconEdit />
        </button>
      {/if}
    </div>

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

                <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-8 gap-2 max-w-6xl">
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
                  {@const isGoldenFullClear = status.className === 'status-golden-full-clear'}
                  {@const sideIcon = getSideIcon(level.levelSide)}
                  {@const levelDeathIcon = getDeathIcon(level.levelSide)}
                  {@const draft = draftStats[rowKey(level)] ?? createDraft(level)}
                  <div class="chapter-row hover:bg-white/5 transition-colors {isGoldenFullClear ? 'chapter-row-golden-full-clear' : ''} {goldenFullClearPulse && isGoldenFullClear ? 'golden-full-clear-pulse' : ''}">
                    <div class="chapter-status">
                      <span class="status-badge inline-flex justify-center px-2 py-1 rounded text-[10px] xl:text-[11px] font-bold uppercase tracking-tight {status.className}">
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

                    <div class="stat-cell text-zinc-300">
                      <img src={strawberryIcon.src} alt="" />
                      {#if isEditing}
                        <span class="stat-editor" aria-label="Edit berries collected and available">
                          <input type="number" min="0" max={draft.maxStrawberries} value={draft.strawberries} oninput={(event) => updateDraft(level, 'strawberries', event.currentTarget.value)} />
                          <span class="text-zinc-500">/</span>
                          <input type="number" min="0" value={draft.maxStrawberries} oninput={(event) => updateDraft(level, 'maxStrawberries', event.currentTarget.value)} />
                        </span>
                      {:else}
                        {level.strawberries}/{level.maxStrawberries}
                      {/if}
                    </div>
                    <div class="stat-cell text-yellow-300">
                      <img src={goldenStrawberryIcon.src} alt="" />
                      {#if isEditing}
                        <label class="golden-editor" title="Golden collected">
                          <input type="checkbox" checked={draft.goldenStrawberries >= 1} onchange={(event) => updateDraft(level, 'goldenStrawberries', event.currentTarget.checked)} />
                        </label>
                      {:else}
                        {level.goldenStrawberries >= 1 ? 'Yes' : '-'}
                      {/if}
                    </div>
                    <div class="stat-cell text-zinc-300">
                      <img src={timerIcon.src} alt="" class="opacity-70" />
                      {#if isEditing}
                        <input class="time-editor" value={draft.totalTimeText} aria-label="Total time" oninput={(event) => updateDraft(level, 'totalTimeText', event.currentTarget.value)} />
                      {:else}
                        {formatTime(level.totalTime)}
                      {/if}
                    </div>
                    <div class="stat-cell text-pink-300">
                      {#if sideIcon}<img src={sideIcon} alt="" />{:else}<IconFavorite class="text-lg" />{/if}
                      {#if isEditing}
                        <span class="stat-editor heart-editor" aria-label="Edit hearts collected and available">
                          <input type="number" min="0" max={draft.maxHearts} value={draft.hearts} aria-label="Hearts collected" oninput={(event) => updateDraft(level, 'hearts', event.currentTarget.value)} />
                          <span class="text-zinc-500">/</span>
                          <input type="number" min="0" value={draft.maxHearts} aria-label="Hearts available" oninput={(event) => updateDraft(level, 'maxHearts', event.currentTarget.value)} />
                        </span>
                      {:else}
                        {level.hearts}/{level.maxHearts}
                      {/if}
                    </div>
                    <div class="stat-cell text-red-300">
                      {#if levelDeathIcon}<img src={levelDeathIcon} alt="" />{:else}<IconSkull class="text-lg" />{/if}
                      {#if isEditing}
                        <input class="number-editor" type="number" min="0" value={draft.deaths} aria-label="Deaths" oninput={(event) => updateDraft(level, 'deaths', event.currentTarget.value)} />
                      {:else}
                        {level.deaths}
                      {/if}
                    </div>
                    <div class="stat-cell text-zinc-400">
                      {#if levelDeathIcon}<img src={levelDeathIcon} alt="" class="opacity-60" />{:else}<IconSkull class="text-lg opacity-70" />{/if}
                      {#if isEditing}
                        <input class="number-editor" type="number" min="0" value={draft.fewestDeaths} aria-label="Fewest deaths" oninput={(event) => updateDraft(level, 'fewestDeaths', event.currentTarget.value)} />
                      {:else}
                        {level.fewestDeaths}
                      {/if}
                    </div>
                    <div class="stat-cell text-cyan-300">
                      <IconBolt class="text-xl" />
                      {#if isEditing}
                        <input class="number-editor" type="number" min="0" value={draft.dashes} aria-label="Dashes" oninput={(event) => updateDraft(level, 'dashes', event.currentTarget.value)} />
                      {:else}
                        {level.dashes}
                      {/if}
                    </div>
                    <div class="stat-cell text-zinc-400">
                      <IconDirectionsRun class="text-lg" />
                      {#if isEditing}
                        <input class="number-editor" type="number" min="0" value={draft.jumps} aria-label="Jumps" oninput={(event) => updateDraft(level, 'jumps', event.currentTarget.value)} />
                      {:else}
                        {level.jumps}
                      {/if}
                    </div>
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
      repeat(2, minmax(3.1rem, 0.48fr))
      minmax(5.8rem, 0.72fr)
      repeat(5, minmax(3.1rem, 0.48fr));
    align-items: center;
    gap: 0.35rem;
  }

  .chapter-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 0.9rem;
  }

  .table-icon-button,
  .table-action-button {
    display: inline-flex;
    min-height: 2.25rem;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    background: rgba(24, 24, 27, 0.78);
    color: rgb(212, 212, 216);
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition:
      background 160ms ease,
      border-color 160ms ease,
      color 160ms ease;
  }

  .table-icon-button {
    width: 2.25rem;
    padding: 0;
    font-size: 1.15rem;
  }

  .table-action-button {
    padding: 0 0.8rem;
  }

  .table-icon-button:hover,
  .table-action-button:hover {
    border-color: rgba(255, 255, 255, 0.22);
    background: rgba(39, 39, 42, 0.96);
    color: white;
  }

  .table-action-button-primary {
    border-color: rgba(127, 210, 255, 0.32);
    background: rgba(14, 116, 144, 0.32);
    color: rgb(224, 242, 254);
  }

  .table-action-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .chapter-row-golden-full-clear {
    background:
      linear-gradient(90deg, rgba(250, 204, 21, 0.075), rgba(245, 158, 11, 0.035)),
      rgba(113, 63, 18, 0.045);
  }

  .chapter-row-golden-full-clear:hover {
    background:
      linear-gradient(90deg, rgba(250, 204, 21, 0.12), rgba(245, 158, 11, 0.06)),
      rgba(113, 63, 18, 0.06);
  }

  .chapter-status {
    display: flex;
    align-items: center;
  }

  .status-badge {
    position: relative;
    overflow: hidden;
    white-space: nowrap;
    transition:
      color 180ms ease,
      border-color 180ms ease,
      background 180ms ease,
      box-shadow 180ms ease,
      transform 180ms ease;
  }

  .status-golden-full-clear {
    border: 1px solid rgba(250, 204, 21, 0.38);
    background:
      linear-gradient(135deg, rgba(250, 204, 21, 0.18), rgba(245, 158, 11, 0.1)),
      rgba(113, 63, 18, 0.16);
    color: rgb(254, 243, 199);
    box-shadow: inset 0 0 0 1px rgba(255, 247, 237, 0.04);
    text-shadow: 0 0 12px rgba(250, 204, 21, 0.34);
  }

  .status-golden-full-clear::after {
    content: "";
    position: absolute;
    inset: -40% auto -40% -55%;
    width: 48%;
    transform: skewX(-18deg);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(254, 240, 138, 0.42),
      transparent
    );
    opacity: 0;
    pointer-events: none;
  }

  .chapter-row:hover .status-golden-full-clear,
  .golden-full-clear-pulse .status-golden-full-clear,
  .status-golden-full-clear:hover,
  .status-golden-full-clear:focus-visible {
    border-color: rgba(250, 204, 21, 0.62);
    background:
      linear-gradient(135deg, rgba(250, 204, 21, 0.24), rgba(245, 158, 11, 0.16)),
      rgba(113, 63, 18, 0.2);
    box-shadow:
      inset 0 0 0 1px rgba(255, 247, 237, 0.08),
      0 0 18px rgba(250, 204, 21, 0.12);
    transform: translateY(-1px);
  }

  .chapter-row:hover .status-golden-full-clear::after,
  .golden-full-clear-pulse .status-golden-full-clear::after,
  .status-golden-full-clear:hover::after,
  .status-golden-full-clear:focus-visible::after {
    animation: golden-full-clear-sheen 780ms cubic-bezier(0.22, 1, 0.36, 1);
    opacity: 1;
  }

  @keyframes golden-full-clear-sheen {
    from {
      left: -55%;
    }

    to {
      left: 115%;
    }
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

  .stat-editor {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
  }

  .stat-editor input,
  .number-editor,
  .time-editor {
    width: 2.05rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.35rem;
    background: rgba(9, 9, 11, 0.7);
    color: inherit;
    padding: 0.15rem 0.2rem;
    text-align: center;
    font: inherit;
    outline: none;
  }

  .time-editor {
    width: 4.85rem;
  }

  .number-editor {
    width: 3.1rem;
  }

  .stat-editor input:focus,
  .number-editor:focus,
  .time-editor:focus {
    border-color: rgba(244, 114, 182, 0.65);
    box-shadow: 0 0 0 2px rgba(244, 114, 182, 0.12);
  }

  .golden-editor {
    display: inline-flex;
    width: 1.4rem;
    height: 1.4rem;
    align-items: center;
    justify-content: center;
  }

  .golden-editor input {
    width: 1rem;
    height: 1rem;
    accent-color: rgb(250, 204, 21);
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
        repeat(2, minmax(3.1rem, 0.48fr))
        minmax(5.8rem, 0.72fr)
        repeat(5, minmax(3.1rem, 0.48fr));
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
