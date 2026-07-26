export type LocalModsOptions = {
	invalidateCache?: {
		ALL_EVEREST_MODS_INFO?: boolean;
		EVERESTMODID_TO_MADDIESMODINFO?: boolean;
		EVERESTMODID_TO_AUTHORINFO?: boolean;
		HISTORICAL_UNINSTALLED_MODS?: boolean;
	};
};

export type ModSimplified = {
	humanNameMod: string;
	modId: string;
};

/** A mod discovered only via a save file's `<LevelSetRecycleBin>` — never scanned by this app, best-effort identified by the root `/`-segment of its `LevelSetStats Name`. */
export type HistoricalModEntry = {
	rootId: string;
	levelSetNames: string[];
	category: string | null;
};

/** One row of "every mod this player has or has had", joining the Everest scan cache, a freshness check, and historical LevelSet data. */
export type ModDbEntry = {
	/** Real Everest mod id (`metadata.name`). `null` only for tier-2 fallback entries never scanned by this app. */
	modNameId: string | null;
	levelSetNames: string[];
	humanName: string;
	category: string | null;
	sizeBytes: number | null;
	/** `null` for tier-2 fallback entries — unrecoverable once the mod's everest.yaml is gone. */
	dependenciesCount: number | null;
	installed: boolean;
};

export type GetModStatsOptions = LocalModsOptions & {
	/** Save slot number to retrieve statistics for (0-indexed). Required. */
	saveSlot: number;
	/** Force refresh cached metadata or save readings. */
	forceRefresh?: boolean;
};

/** Pair representing progress: current collected vs total available. */
export type ModItemProgress = {
	current: number;
	total: number;
};

export type ModSpecialStrawberriesStats = {
	golden: ModItemProgress;
	silver: ModItemProgress;
	rainbow: ModItemProgress;
	platinum: ModItemProgress;
	moon: ModItemProgress;
	wingedGolden: ModItemProgress;
	speedTimers: {
		bronze: number;
		silver: number;
		gold: number;
		total: number;
	};
};

export type ModBasicStats = {
	deaths: number;
	minimumDeaths: number;
	playTimeMs: number;
	/** Count of red-only strawberries collected vs total available. */
	redStrawberries: ModItemProgress;
	specialStrawberries: ModSpecialStrawberriesStats;
	hearts: ModItemProgress;
	miniHearts: ModItemProgress;
};

export type VanillaModSpecialStrawberriesStats = {
	golden: ModItemProgress;
	moon: ModItemProgress;
	wingedGolden: ModItemProgress;
};

export type VanillaModBasicStats = {
	deaths: number;
	minimumDeaths: number;
	playTimeMs: number;
	/** Count of red-only strawberries collected vs total available. */
	redStrawberries: ModItemProgress;
	specialStrawberries: VanillaModSpecialStrawberriesStats;
	hearts: ModItemProgress;
};

export type ChapterSideStats = {
	side: "A" | "B" | "C" | string;
	completed: boolean;
	singleRunCompleted: boolean;
	fullClear: boolean;
	deaths: number;
	playTimeMs: number;
	bestTimeMs: number;
	bestFullClearTimeMs: number;
	bestDashes: number;
	bestDeaths: number;
	heartCollected: boolean;
	/** Count of red-only strawberries collected in this side. */
	berriesCollected: number;
	/** Count of red-only strawberries available in this side (0 for B/C sides). */
	berriesAvailable: number;
	goldenStrawberry?: boolean;
	wingedStrawberry?: boolean;
	moonBerry?: boolean;
};

export type ChapterStatsSummary = {
	sid: string;
	name: string | null;
	iconPath: string | null;
	sides: Record<string, ChapterSideStats>;
};

export type LobbyStatsSummary = {
	lobbyId: string;
	name: string | null;
	stats: ModBasicStats;
	chapters: ChapterStatsSummary[];
};

/** Common properties shared by all mod statistics results. */
export type BaseModStatistics = {
	modId: string;
	humanName: string;
	saveSlot: number;
	/** Total dashes across all campaigns and installed mods in this save slot. Sourced from <TotalDashes>. */
	saveWideDashes: number;
	/** Total jumps across all campaigns and installed mods in this save slot. Sourced from <TotalJumps>. */
	saveWideJumps: number;
	global: ModBasicStats;
};

/** Result shape specifically for Vanilla Celeste campaign (`isVanilla: true`). */
export type VanillaModStatisticsResult = {
	modId: "Celeste" | string;
	humanName: string;
	isVanilla: true;
	isLobbyMod: false;
	saveSlot: number;
	/** Total dashes across all campaigns and installed mods in this save slot. Sourced from <TotalDashes>. */
	saveWideDashes: number;
	/** Total jumps across all campaigns and installed mods in this save slot. Sourced from <TotalJumps>. */
	saveWideJumps: number;
	global: VanillaModBasicStats;
	campaigns: Record<string, VanillaModBasicStats>;
	chapters: Record<string, ChapterStatsSummary>;
};

/** Result shape specifically for Collab / Lobby mods (e.g. Strawberry Jam, Spring Collab). */
export type LobbyModStatisticsResult = BaseModStatistics & {
	isVanilla: false;
	isLobbyMod: true;
	collabId: string;
	lobbies: Record<string, LobbyStatsSummary>;
	gyms: Record<string, ModBasicStats>;
	prologue?: ChapterStatsSummary;
	chapters: Record<string, ChapterStatsSummary>;
};

/** Result shape for Standalone map mods. */
export type StandaloneModStatisticsResult = BaseModStatistics & {
	isVanilla: false;
	isLobbyMod: false;
	campaigns: Record<string, ModBasicStats>;
	chapters: Record<string, ChapterStatsSummary>;
};

/** Discriminated union for mod statistics results, tagged by `isVanilla` and `isLobbyMod`. */
export type ModStatisticsResult = VanillaModStatisticsResult | LobbyModStatisticsResult | StandaloneModStatisticsResult;

export function createEmptyModBasicStats(): ModBasicStats {
	return {
		deaths: 0,
		minimumDeaths: 0,
		playTimeMs: 0,
		redStrawberries: { current: 0, total: 0 },
		specialStrawberries: {
			golden: { current: 0, total: 0 },
			silver: { current: 0, total: 0 },
			rainbow: { current: 0, total: 0 },
			platinum: { current: 0, total: 0 },
			moon: { current: 0, total: 0 },
			wingedGolden: { current: 0, total: 0 },
			speedTimers: { bronze: 0, silver: 0, gold: 0, total: 0 },
		},
		hearts: { current: 0, total: 0 },
		miniHearts: { current: 0, total: 0 },
	};
}

export function createEmptyVanillaModBasicStats(): VanillaModBasicStats {
	return {
		deaths: 0,
		minimumDeaths: 0,
		playTimeMs: 0,
		redStrawberries: { current: 0, total: 175 },
		specialStrawberries: {
			golden: { current: 0, total: 25 },
			moon: { current: 0, total: 1 },
			wingedGolden: { current: 0, total: 1 },
		},
		hearts: { current: 0, total: 24 },
	};
}
