// UNIVERSAL COMPATIBILITY

import { XMLParser } from "fast-xml-parser";
import { serializeError } from "serialize-error";
import { inject, injectable } from "tsyringe";
import type GameBananaApi from "../api/GameBananaAPI";
import type { GbMemberApi_Reponse } from "../api/GameBananaAPI";
import type MaddiesApi from "../api/MaddiesAPI";
import type { MaddiesApiModInfo } from "../api/MaddiesAPI";
import { IFileSystem_Token } from "../core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../core/interfaces/IFileSystem";
import { AsyncLazy } from "../utils/AsyncLazy";
import { Log_Error, Log_Info } from "../utils/Logger";
import type Storage from "../utils/Storage";
import type Celeste from "./Celeste";
import type { CelesteSaveSlot } from "./Celeste";
import type Everest from "./Everest";
import type { DiscoveredLobby, EverestModInfo } from "./Everest";
import { GetLevelSetNamesForMod } from "./Everest";
import type Olympus from "./Olympus";

const STORAGE_KEY_ALL_EVEREST_MODS_INFO = "localmods_allInstalled";
const STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO = "LocalMods_Map_ModId_To_MaddiesInfo";
const STORAGE_KEY_MAP_EVEREST_MOD_ID_TO_AUTHOR_INFO = "LocalMods_Map_ModId_To_AuthorInfo";
const STORAGE_KEY_HISTORICAL_UNINSTALLED_MODS = "LocalMods_HistoricalUninstalledMods";

const saveFileXmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
	isArray: (tagName) => tagName === "LevelSetStats" || tagName === "AreaStats" || tagName === "AreaModeStats" || tagName === "EntityID" || tagName === "string",
});

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
type BaseModStatistics = {
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

function createEmptyModBasicStats(): ModBasicStats {
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

function createEmptyVanillaModBasicStats(): VanillaModBasicStats {
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

@injectable()
export default class DBMods {
	#everestModsLazy = new AsyncLazy((opts?: LocalModsOptions) =>
		this.storage.get<Record<string, EverestModInfo>>(
			STORAGE_KEY_ALL_EVEREST_MODS_INFO,
			async () => {
				const allMods = await this.everest.GetModsInstalledFull({ workerCount: 4 });
				const map: Record<string, EverestModInfo> = {};
				for (const mod of allMods) {
					if (mod.metadata.name && mod.metadata.name.trim() !== "") {
						map[mod.metadata.name] = mod;
					}
				}
				return map;
			},
			{ invalidateCache: opts?.invalidateCache?.ALL_EVEREST_MODS_INFO },
		),
	);

	#maddiesMapLazy = new AsyncLazy((opts?: LocalModsOptions) => {
		type Map_EverestModId_MaddiesModInfo = Record<string, MaddiesApiModInfo>;

		return this.storage.get<Map_EverestModId_MaddiesModInfo>(
			STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO,
			async () => {
				const allMods = await this.EverestMods_GetAll(opts);
				const modsList = Object.values(allMods);
				if (modsList.length === 0) return {};

				type MaddiesLookupResult = {
					everestModId: string;
					maddiesInfo: MaddiesApiModInfo;
				} | null;

				const settledResults = await Promise.allSettled(
					modsList.map<Promise<MaddiesLookupResult>>(async (mod) => {
						const everestModId = mod.metadata.name;
						try {
							const searchResults = await this.maddiesApi.SearchModByName(mod.humanName || everestModId);
							const bestMatch = searchResults[0];
							if (!bestMatch) return null;

							return { everestModId, maddiesInfo: bestMatch };
						} catch (e: unknown) {
							Log_Error("LocalMods.ts:", "(Maddies MULTIPLE FETCH) | When trying to fetch maddies api info, got error | Error =>", serializeError(e));
							throw e;
						}
					}),
				);

				const map: Map_EverestModId_MaddiesModInfo = {};
				for (const result of settledResults) {
					if (result.status !== "fulfilled" || result.value === null) continue;
					map[result.value.everestModId] = result.value.maddiesInfo;
				}

				return map;
			},
			{ invalidateCache: opts?.invalidateCache?.EVERESTMODID_TO_MADDIESMODINFO },
		);
	});

	#authorMapLazy = new AsyncLazy((opts?: LocalModsOptions) => {
		type MapType = Record<string, GbMemberApi_Reponse>;
		return this.storage.get<MapType>(
			STORAGE_KEY_MAP_EVEREST_MOD_ID_TO_AUTHOR_INFO,
			async () => {
				const modIdToMod = await this.#GetMap_EverestModId_MaddiesMod(opts);
				const grouped = new Map<string, string[]>();
				for (const [modId, mod] of Object.entries(modIdToMod)) {
					const list = grouped.get(mod.Author);
					if (list) list.push(modId);
					else grouped.set(mod.Author, [modId]);
				}
				const apiResponse = await this.gameBananaApi.GetUsersMetadataByUsernames([...grouped.keys()]);
				const toReturn: MapType = {};
				for (const info of apiResponse) {
					const modIds = grouped.get(info.name);
					if (modIds) for (const modId of modIds) toReturn[modId] = info;
				}
				return toReturn;
			},
			{ invalidateCache: opts?.invalidateCache?.EVERESTMODID_TO_AUTHORINFO },
		);
	});

	#historicalModsLazy = new AsyncLazy((opts?: LocalModsOptions) =>
		this.storage.get<Record<string, HistoricalModEntry>>(STORAGE_KEY_HISTORICAL_UNINSTALLED_MODS, () => this.#ComputeHistoricalMods(opts), {
			invalidateCache: opts?.invalidateCache?.HISTORICAL_UNINSTALLED_MODS,
		}),
	);

	constructor(
		private everest: Everest,
		private storage: Storage,
		private maddiesApi: MaddiesApi,
		private gameBananaApi: GameBananaApi,
		private olympus: Olympus,
		@inject(IFileSystem_Token) private fs: IFileSystem,
		private celeste: Celeste,
	) {
		storage.configureAutoSave("turn off");
	}

	public async EverestMods_GetAll(opts?: LocalModsOptions): Promise<Record<string, EverestModInfo>> {
		Log_Info("LocalMods.ts:", "About to load all mods full!");
		const toReturn = await this.#everestModsLazy.get(opts, { forceRefresh: opts?.invalidateCache?.ALL_EVEREST_MODS_INFO });
		Log_Info("LocalMods.ts:", "All mods info loaded");
		return toReturn;
	}

	public async EverestMods_Get_ModByModId(modId: string, opts?: LocalModsOptions): Promise<EverestModInfo | null> {
		const allMods = await this.EverestMods_GetAll(opts);
		return allMods[modId] ?? null;
	}

	public async EverestMods_Get_ListModIds(opts?: LocalModsOptions): Promise<string[]> {
		const allMods = await this.EverestMods_GetAll(opts);
		return Object.keys(allMods).filter((k) => k && k !== "undefined");
	}

	public async EverestMods_Get_ListModSimplified(opts?: LocalModsOptions): Promise<ModSimplified[]> {
		const allMods = await this.EverestMods_GetAll(opts);
		const list: ModSimplified[] = [];
		for (const mod of Object.values(allMods)) {
			if (mod.metadata?.name) {
				list.push({
					humanNameMod: mod.humanName && mod.humanName.trim() !== "" ? mod.humanName : mod.metadata.name,
					modId: mod.metadata.name,
				});
			}
		}
		return list;
	}

	// ============ MADDIES API LOGIC ================

	async #GetMap_EverestModId_MaddiesMod(opts?: LocalModsOptions) {
		return await this.#maddiesMapLazy.get(opts, { forceRefresh: opts?.invalidateCache?.EVERESTMODID_TO_MADDIESMODINFO });
	}

	public async MaddiesApi_GetAll(opts?: LocalModsOptions): Promise<MaddiesApiModInfo[]> {
		const res = await this.#GetMap_EverestModId_MaddiesMod(opts);
		return Object.values(res);
	}

	async #GetSingleOrFetchBackground<T>(options: {
		storageKey: string;
		lookupKey: string;
		singleFetchFn: () => Promise<T | null>;
		backgroundPopulateFn: () => Promise<unknown>;
		logContext: string;
	}): Promise<T | null> {
		const cachedMap = await this.storage.get<Record<string, T>>(options.storageKey);
		if (cachedMap) {
			return cachedMap[options.lookupKey] ?? null;
		}

		let item: T | null = null;
		try {
			item = await options.singleFetchFn();
		} catch (e: unknown) {
			Log_Error("LocalMods.ts:", `| (${options.logContext}) When trying to fetch single info, got error | Error =>`, serializeError(e));
		}

		options.backgroundPopulateFn();
		return item;
	}

	public async MaddiesApi_Get_ModByModId(modId: string, opts?: LocalModsOptions): Promise<MaddiesApiModInfo | null> {
		const modInfo = await this.#GetSingleOrFetchBackground<MaddiesApiModInfo>({
			storageKey: STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO,
			lookupKey: modId,
			singleFetchFn: async () => {
				const allMods = await this.EverestMods_GetAll(opts);
				const mod = allMods[modId];
				const searchName = mod?.humanName || modId;
				const _allFound = await this.maddiesApi.SearchModByName(searchName);
				return _allFound?.[0] ?? null;
			},
			backgroundPopulateFn: () => this.#GetMap_EverestModId_MaddiesMod(opts),
			logContext: "Maddies SINGLE FETCH",
		});
		return await this.maddiesApi.ResolveAndInjectModScreenshotsSrcsInto(modInfo);
	}

	async #GetMap_EverestModId_GameBananaAuthor(opts?: LocalModsOptions) {
		return await this.#authorMapLazy.get(opts, { forceRefresh: opts?.invalidateCache?.EVERESTMODID_TO_AUTHORINFO });
	}

	public async GameBananaApi_GetAuthorInfoByModId(modId: string, opts?: LocalModsOptions): Promise<GbMemberApi_Reponse | null> {
		return await this.#GetSingleOrFetchBackground<GbMemberApi_Reponse>({
			storageKey: STORAGE_KEY_MAP_EVEREST_MOD_ID_TO_AUTHOR_INFO,
			lookupKey: modId,
			singleFetchFn: async () => {
				const maddiesInfo = await this.MaddiesApi_Get_ModByModId(modId, opts);
				if (!maddiesInfo?.Author) return null;
				const apiResponse = await this.gameBananaApi.GetUsersMetadataByUsernames([maddiesInfo.Author]);
				return apiResponse?.[0] ?? null;
			},
			backgroundPopulateFn: () => this.#GetMap_EverestModId_GameBananaAuthor(opts),
			logContext: "GameBanana Author SINGLE FETCH",
		});
	}

	// ============ MOD DATABASE: CATEGORY + HISTORICAL (UNINSTALLED) MODS ================

	public async ResolveModCategory(modId: string, opts?: LocalModsOptions): Promise<string | null> {
		const olympusAvailable = await this.olympus.isInstalled();
		if (olympusAvailable) {
			return await this.olympus.GetModCategoryByModId(modId).catch(() => null);
		}
		const maddiesInfo = await this.MaddiesApi_Get_ModByModId(modId, opts).catch(() => null);
		return maddiesInfo?.CategoryName ?? null;
	}

	async #ComputeHistoricalMods(opts?: LocalModsOptions): Promise<Record<string, HistoricalModEntry>> {
		const installedMods = await this.EverestMods_GetAll(opts);
		const knownLevelSetNames = new Set(Object.values(installedMods).flatMap((m) => GetLevelSetNamesForMod(m)));

		const historical = await this.everest.GetAllHistoricalLevelSetNames();
		const unmatched = historical.recycledLevelSetNames.filter((n) => !knownLevelSetNames.has(n));

		const groups = new Map<string, string[]>();
		for (const name of unmatched) {
			const rootId = name.split("/")[0];
			const list = groups.get(rootId);
			if (list) list.push(name);
			else groups.set(rootId, [name]);
		}

		const settled = await Promise.allSettled(
			[...groups.entries()].map(
				async ([rootId, levelSetNames]): Promise<[string, HistoricalModEntry]> => [
					rootId,
					{ rootId, levelSetNames, category: await this.ResolveModCategory(rootId, opts).catch(() => null) },
				],
			),
		);
		const map: Record<string, HistoricalModEntry> = {};
		for (const r of settled) if (r.status === "fulfilled") map[r.value[0]] = r.value[1];
		return map;
	}

	public async HistoricalMods_GetAll(opts?: LocalModsOptions): Promise<Record<string, HistoricalModEntry>> {
		return await this.#historicalModsLazy.get(opts, { forceRefresh: opts?.invalidateCache?.HISTORICAL_UNINSTALLED_MODS });
	}

	public async Mods_GetAllWithHistory(opts?: LocalModsOptions): Promise<ModDbEntry[]> {
		const cachedMods = await this.EverestMods_GetAll(opts);
		const existenceChecks = await Promise.allSettled(Object.values(cachedMods).map(async (mod) => ({ mod, exists: await this.fs.exists(mod.modPath) })));
		const stillInstalled: EverestModInfo[] = [];
		const goneButCached: EverestModInfo[] = [];
		for (const r of existenceChecks) {
			if (r.status !== "fulfilled") continue;
			(r.value.exists ? stillInstalled : goneButCached).push(r.value.mod);
		}

		const rowFromCachedMod = async (mod: EverestModInfo, installed: boolean): Promise<ModDbEntry> => {
			const modNameId = mod.metadata.name;
			return {
				modNameId,
				levelSetNames: GetLevelSetNamesForMod(mod),
				humanName: mod.humanName || modNameId,
				category: await this.ResolveModCategory(modNameId, opts).catch(() => null),
				sizeBytes: mod.sizeBytes ?? null,
				dependenciesCount: mod.metadata.dependencies?.length ?? 0,
				installed,
			};
		};
		const installedRows = await Promise.allSettled(stillInstalled.map((m) => rowFromCachedMod(m, true)));
		const goneRows = await Promise.allSettled(goneButCached.map((m) => rowFromCachedMod(m, false)));

		const historicalMap = await this.HistoricalMods_GetAll(opts);
		const historicalRows: ModDbEntry[] = Object.values(historicalMap).map((h) => ({
			modNameId: null,
			levelSetNames: h.levelSetNames,
			humanName: h.rootId,
			category: h.category,
			sizeBytes: null,
			dependenciesCount: null,
			installed: false,
		}));

		return [...installedRows, ...goneRows]
			.filter((r): r is PromiseFulfilledResult<ModDbEntry> => r.status === "fulfilled")
			.map((r) => r.value)
			.concat(historicalRows);
	}

	public async Mods_GetAllHistorical(opts?: LocalModsOptions): Promise<ModDbEntry[]> {
		return await this.Mods_GetAllWithHistory(opts);
	}

	// ============ GAMEPLAY STATISTICS RETRIEVAL BY MOD ================

	/**
	 * Retrieve all global and campaign/lobby/chapter gameplay statistics for a mod.
	 *
	 * Obeying the Options Object Pattern, `opts.saveSlot` specifies the exact 0-indexed save slot.
	 */
	public async GetStatisticsByModId(modId: string, opts: GetModStatsOptions): Promise<ModStatisticsResult> {
		const isVanilla = modId === "Celeste" || modId.toLowerCase() === "celeste";

		const allSlots = await this.celeste.GetAllSaveSlots();
		const slot = allSlots.find((s) => s.slotNumber === opts.saveSlot);

		if (!slot) {
			const emptyGlobal = createEmptyModBasicStats();
			const emptyVanillaGlobal = createEmptyVanillaModBasicStats();

			if (isVanilla) {
				return {
					modId: "Celeste",
					humanName: "Celeste",
					isVanilla: true,
					isLobbyMod: false,
					saveSlot: opts.saveSlot,
					saveWideDashes: 0,
					saveWideJumps: 0,
					global: emptyVanillaGlobal,
					campaigns: { Celeste: emptyVanillaGlobal },
					chapters: {},
				};
			}

			const modInfo = await this.EverestMods_Get_ModByModId(modId, opts);
			const humanName = modInfo?.humanName || modId;
			const isLobby = modInfo?.metadata?.isLobby === true;

			if (isLobby) {
				return {
					modId,
					humanName,
					isVanilla: false,
					isLobbyMod: true,
					collabId: typeof modInfo?.metadata?.collabId === "string" && modInfo.metadata.collabId ? modInfo.metadata.collabId : modId,
					saveSlot: opts.saveSlot,
					saveWideDashes: 0,
					saveWideJumps: 0,
					global: emptyGlobal,
					lobbies: {},
					gyms: {},
					chapters: {},
				};
			}

			return {
				modId,
				humanName,
				isVanilla: false,
				isLobbyMod: false,
				saveSlot: opts.saveSlot,
				saveWideDashes: 0,
				saveWideJumps: 0,
				global: emptyGlobal,
				campaigns: {},
				chapters: {},
			};
		}

		if (isVanilla) {
			return await this.#GetVanillaStatistics(slot);
		}

		const modInfo = await this.EverestMods_Get_ModByModId(modId, opts);
		const humanName = modInfo?.humanName || modId;
		const isLobbyMod = modInfo?.metadata?.isLobby === true;

		if (isLobbyMod && modInfo?.metadata?.isLobby) {
			return await this.#GetLobbyModStatistics(modId, humanName, modInfo, slot);
		}

		return await this.#GetStandaloneModStatistics(modId, humanName, modInfo, slot);
	}

	async #GetVanillaStatistics(slot: CelesteSaveSlot): Promise<VanillaModStatisticsResult> {
		const MAX_RED_BERRIES_BY_SID: Record<string, { maxRed: number; sides: ("A" | "B" | "C")[] }> = {
			"Celeste/0-Intro": { maxRed: 0, sides: ["A"] },
			"Celeste/1-ForsakenCity": { maxRed: 20, sides: ["A", "B", "C"] },
			"Celeste/2-OldSite": { maxRed: 18, sides: ["A", "B", "C"] },
			"Celeste/3-CelestialResort": { maxRed: 25, sides: ["A", "B", "C"] },
			"Celeste/4-GoldenRidge": { maxRed: 29, sides: ["A", "B", "C"] },
			"Celeste/5-MirrorTemple": { maxRed: 31, sides: ["A", "B", "C"] },
			"Celeste/6-Reflection": { maxRed: 0, sides: ["A", "B", "C"] },
			"Celeste/7-Summit": { maxRed: 47, sides: ["A", "B", "C"] },
			"Celeste/8-Epilogue": { maxRed: 0, sides: ["A"] },
			"Celeste/9-Core": { maxRed: 5, sides: ["A", "B", "C"] },
			"Celeste/LostLevels": { maxRed: 0, sides: ["A"] },
		};

		const VANILLA_CHAPTER_NAMES: Record<string, string> = {
			"Celeste/0-Intro": "Prologue",
			"Celeste/1-ForsakenCity": "Forsaken City",
			"Celeste/2-OldSite": "Old Site",
			"Celeste/3-CelestialResort": "Celestial Resort",
			"Celeste/4-GoldenRidge": "Golden Ridge",
			"Celeste/5-MirrorTemple": "Mirror Temple",
			"Celeste/6-Reflection": "Reflection",
			"Celeste/7-Summit": "The Summit",
			"Celeste/8-Epilogue": "Epilogue",
			"Celeste/9-Core": "Core",
			"Celeste/LostLevels": "Farewell",
		};

		const global: VanillaModBasicStats = createEmptyVanillaModBasicStats();
		const chaptersMap: Record<string, ChapterStatsSummary> = {};

		let saveWideDashes = 0;
		let saveWideJumps = 0;

		try {
			const content = await this.fs.readFile(slot.fileAbsolutePath);
			const parsed = saveFileXmlParser.parse(content)?.SaveData;
			if (parsed) {
				saveWideDashes = Number(parsed.TotalDashes ?? 0);
				saveWideJumps = Number(parsed.TotalJumps ?? 0);

				const areasList = Array.isArray(parsed.Areas?.AreaStats) ? parsed.Areas.AreaStats : [];
				for (const area of areasList) {
					const sid = String(area?.["@_SID"] ?? "");
					const config = MAX_RED_BERRIES_BY_SID[sid];
					if (!sid || !config) continue;

					if (!chaptersMap[sid]) {
						chaptersMap[sid] = {
							sid,
							name: VANILLA_CHAPTER_NAMES[sid] ?? null,
							iconPath: null,
							sides: {},
						};
					}

					const modes = Array.isArray(area.Modes?.AreaModeStats) ? area.Modes.AreaModeStats : [];
					const sideNames = ["A", "B", "C"] as const;

					for (let idx = 0; idx < modes.length; idx++) {
						const mode = modes[idx];
						if (!mode) continue;
						const sideName = sideNames[idx];
						if (!sideName || !config.sides.includes(sideName)) continue;

						const completed = mode["@_Completed"] === "true" || mode["@_Completed"] === true;
						const singleRunCompleted = mode["@_SingleRunCompleted"] === "true" || mode["@_SingleRunCompleted"] === true;
						const fullClear = mode["@_FullClear"] === "true" || mode["@_FullClear"] === true;
						const deaths = Number(mode["@_Deaths"] ?? 0);
						const playTimeMs = Math.round(Number(mode["@_TimePlayed"] ?? 0) / 10000);
						const bestTimeMs = Math.round(Number(mode["@_BestTime"] ?? 0) / 10000);
						const bestFullClearTimeMs = Math.round(Number(mode["@_BestFullClearTime"] ?? 0) / 10000);
						const bestDashes = Number(mode["@_BestDashes"] ?? 0);
						const bestDeaths = Number(mode["@_BestDeaths"] ?? 0);
						const heartCollected = mode["@_HeartGem"] === "true" || mode["@_HeartGem"] === true;

						const strawberriesList = Array.isArray(mode.Strawberries?.EntityID) ? mode.Strawberries.EntityID : [];
						const rawBerryCount = strawberriesList.length;

						const hasActivity = completed || deaths > 0 || playTimeMs > 0 || heartCollected || rawBerryCount > 0 || bestTimeMs > 0 || bestDashes > 0;
						if (!hasActivity) continue;

						global.deaths += deaths;
						global.playTimeMs += playTimeMs;

						let goldenStrawberry = false;
						let wingedStrawberry = false;
						let moonBerry = false;

						if (sideName === "B" || sideName === "C") {
							goldenStrawberry = rawBerryCount > 0;
						} else if (sid === "Celeste/LostLevels") {
							// Farewell: j-19:9 is moon berry; first-room prefixed key (or single berry) golden
							for (const entity of strawberriesList) {
								const key = String(entity?.["@_Key"] ?? "");
								if (key === "j-19:9") {
									moonBerry = true;
								}
							}
							goldenStrawberry = rawBerryCount > (moonBerry ? 1 : 0);
						} else if (sideName === "A") {
							for (const entity of strawberriesList) {
								const key = String(entity?.["@_Key"] ?? "");
								if (sid === "Celeste/1-ForsakenCity" && key === "end:4") {
									wingedStrawberry = true;
								}
							}
							goldenStrawberry = rawBerryCount > config.maxRed + (wingedStrawberry ? 1 : 0);
						}

						const redBerryCount = sideName === "A" ? Math.min(rawBerryCount - (wingedStrawberry ? 1 : 0) - (goldenStrawberry ? 1 : 0), config.maxRed) : 0;

						if (redBerryCount > 0) global.redStrawberries.current += redBerryCount;
						if (goldenStrawberry) global.specialStrawberries.golden.current += 1;
						if (wingedStrawberry) global.specialStrawberries.wingedGolden.current = 1;
						if (moonBerry) global.specialStrawberries.moon.current = 1;

						if (heartCollected) global.hearts.current += 1;

						chaptersMap[sid].sides[sideName] = {
							side: sideName,
							completed,
							singleRunCompleted,
							fullClear,
							deaths,
							playTimeMs,
							bestTimeMs,
							bestFullClearTimeMs,
							bestDashes,
							bestDeaths,
							heartCollected,
							berriesCollected: Math.max(0, redBerryCount),
							berriesAvailable: sideName === "A" ? config.maxRed : 0,
							goldenStrawberry,
							wingedStrawberry,
							moonBerry,
						};
					}
				}
			}
		} catch (e: unknown) {
			Log_Error("LocalMods.ts:", `| Failed to parse vanilla save stats for slot ${slot.slotNumber} |`, serializeError(e));
		}

		let minDeathsSum = 0;
		for (const summary of Object.values(chaptersMap)) {
			for (const side of Object.values(summary.sides)) {
				if (side.completed && side.bestDeaths >= 0) {
					minDeathsSum += side.bestDeaths;
				}
			}
		}
		global.minimumDeaths = minDeathsSum;

		return {
			modId: "Celeste",
			humanName: "Celeste",
			isVanilla: true,
			isLobbyMod: false,
			saveSlot: slot.slotNumber,
			saveWideDashes,
			saveWideJumps,
			global,
			campaigns: { Celeste: global },
			chapters: chaptersMap,
		};
	}

	async #GetLobbyModStatistics(modId: string, humanName: string, modInfo: EverestModInfo, slot: CelesteSaveSlot): Promise<LobbyModStatisticsResult> {
		const meta = modInfo.metadata;
		const collabId = meta.isLobby ? meta.collabId || modId : modId;
		const levelSetNames = GetLevelSetNamesForMod(modInfo);

		const global = createEmptyModBasicStats();
		const lobbiesMap: Record<string, LobbyStatsSummary> = {};
		const gymsMap: Record<string, ModBasicStats> = {};
		const chaptersMap: Record<string, ChapterStatsSummary> = {};

		const lobbiesList: DiscoveredLobby[] = meta.isLobby && meta.lobbies ? meta.lobbies : [];
		for (const lobby of lobbiesList) {
			const lobbyId = lobby.lobbyId;
			lobbiesMap[lobbyId] = {
				lobbyId,
				name: lobbyId,
				stats: createEmptyModBasicStats(),
				chapters: [],
			};
		}

		let saveWideDashes = 0;
		let saveWideJumps = 0;

		try {
			const content = await this.fs.readFile(slot.fileAbsolutePath);
			const parsed = saveFileXmlParser.parse(content)?.SaveData;
			if (parsed) {
				saveWideDashes = Number(parsed.TotalDashes ?? 0);
				saveWideJumps = Number(parsed.TotalJumps ?? 0);

				type CollabModSave = {
					SpeedBerryPBs?: Record<string, number>;
					OpenedMiniHeartDoors?: string[];
					CombinedRainbowBerries?: string[];
				};
				const modSave = await this.everest.ReadModSaveData<CollabModSave>(slot.slotNumber, "CollabUtils2");

				if (modSave?.CombinedRainbowBerries) {
					const matchingRainbows = modSave.CombinedRainbowBerries.filter((l) => levelSetNames.some((name) => l.startsWith(name)));
					global.specialStrawberries.rainbow.current = matchingRainbows.length;
				}

				if (modSave?.SpeedBerryPBs) {
					for (const [sid, pbTicks] of Object.entries(modSave.SpeedBerryPBs)) {
						if (levelSetNames.some((name) => sid.startsWith(name))) {
							global.specialStrawberries.speedTimers.total += 1;
							const pbSec = pbTicks / 10000000;
							if (pbSec <= 60) global.specialStrawberries.speedTimers.gold += 1;
							else if (pbSec <= 120) global.specialStrawberries.speedTimers.silver += 1;
							else global.specialStrawberries.speedTimers.bronze += 1;
						}
					}
				}

				const levelSetBlocks = [
					...(Array.isArray(parsed.LevelSets?.LevelSetStats) ? parsed.LevelSets.LevelSetStats : []),
					...(Array.isArray(parsed.LevelSetRecycleBin?.LevelSetStats) ? parsed.LevelSetRecycleBin.LevelSetStats : []),
				];

				for (const block of levelSetBlocks) {
					const blockName = String(block?.["@_Name"] ?? "");
					if (!levelSetNames.includes(blockName)) continue;

					const areasList = Array.isArray(block.Areas?.AreaStats) ? block.Areas.AreaStats : [];
					for (const area of areasList) {
						const sid = String(area?.["@_SID"] ?? "");
						if (!sid) continue;

						if (!chaptersMap[sid]) {
							chaptersMap[sid] = { sid, name: null, iconPath: null, sides: {} };
						}

						const modes = Array.isArray(area.Modes?.AreaModeStats) ? area.Modes.AreaModeStats : [];
						for (let idx = 0; idx < modes.length; idx++) {
							const mode = modes[idx];
							if (!mode) continue;
							const sideName = idx === 0 ? "A" : idx === 1 ? "B" : "C";

							const completed = mode["@_Completed"] === "true" || mode["@_Completed"] === true;
							const deaths = Number(mode["@_Deaths"] ?? 0);
							const playTimeMs = Math.round(Number(mode["@_TimePlayed"] ?? 0) / 10000);
							const bestDeaths = Number(mode["@_BestDeaths"] ?? 0);
							const bestDashes = Number(mode["@_BestDashes"] ?? 0);
							const heartCollected = mode["@_HeartGem"] === "true" || mode["@_HeartGem"] === true;
							const strawberriesList = Array.isArray(mode.Strawberries?.EntityID) ? mode.Strawberries.EntityID : [];

							const hasActivity = completed || deaths > 0 || playTimeMs > 0 || heartCollected || strawberriesList.length > 0;
							if (!hasActivity) continue;

							global.deaths += deaths;
							global.playTimeMs += playTimeMs;
							if (heartCollected) global.miniHearts.current += 1;
							global.redStrawberries.current += strawberriesList.length;

							chaptersMap[sid].sides[sideName] = {
								side: sideName,
								completed,
								singleRunCompleted: mode["@_SingleRunCompleted"] === "true" || mode["@_SingleRunCompleted"] === true,
								fullClear: mode["@_FullClear"] === "true" || mode["@_FullClear"] === true,
								deaths,
								playTimeMs,
								bestTimeMs: Math.round(Number(mode["@_BestTime"] ?? 0) / 10000),
								bestFullClearTimeMs: Math.round(Number(mode["@_BestFullClearTime"] ?? 0) / 10000),
								bestDashes,
								bestDeaths,
								heartCollected,
								berriesCollected: strawberriesList.length,
								berriesAvailable: 0,
							};
						}
					}
				}
			}
		} catch (e: unknown) {
			Log_Error("LocalMods.ts:", `| Failed to parse lobby mod save stats for slot ${slot.slotNumber} |`, serializeError(e));
		}

		let minDeathsSum = 0;
		for (const summary of Object.values(chaptersMap)) {
			for (const side of Object.values(summary.sides)) {
				if (side.completed && side.bestDeaths >= 0) {
					minDeathsSum += side.bestDeaths;
				}
			}
		}
		global.minimumDeaths = minDeathsSum;
		global.specialStrawberries.rainbow.total = lobbiesList.length;
		global.miniHearts.total = Object.keys(chaptersMap).length;

		return {
			modId,
			humanName,
			isVanilla: false,
			isLobbyMod: true,
			collabId,
			saveSlot: slot.slotNumber,
			saveWideDashes,
			saveWideJumps,
			global,
			lobbies: lobbiesMap,
			gyms: gymsMap,
			chapters: chaptersMap,
		};
	}

	async #GetStandaloneModStatistics(
		modId: string,
		humanName: string,
		modInfo: EverestModInfo | null,
		slot: CelesteSaveSlot,
	): Promise<StandaloneModStatisticsResult> {
		const levelSetNames = modInfo ? GetLevelSetNamesForMod(modInfo) : [modId];
		const global = createEmptyModBasicStats();
		const campaignsMap: Record<string, ModBasicStats> = {};
		const chaptersMap: Record<string, ChapterStatsSummary> = {};

		let saveWideDashes = 0;
		let saveWideJumps = 0;

		try {
			const content = await this.fs.readFile(slot.fileAbsolutePath);
			const parsed = saveFileXmlParser.parse(content)?.SaveData;
			if (parsed) {
				saveWideDashes = Number(parsed.TotalDashes ?? 0);
				saveWideJumps = Number(parsed.TotalJumps ?? 0);

				const levelSetBlocks = [
					...(Array.isArray(parsed.LevelSets?.LevelSetStats) ? parsed.LevelSets.LevelSetStats : []),
					...(Array.isArray(parsed.LevelSetRecycleBin?.LevelSetStats) ? parsed.LevelSetRecycleBin.LevelSetStats : []),
				];

				for (const block of levelSetBlocks) {
					const blockName = String(block?.["@_Name"] ?? "");
					if (!levelSetNames.includes(blockName)) continue;

					if (!campaignsMap[blockName]) {
						campaignsMap[blockName] = createEmptyModBasicStats();
					}
					const campaignStats = campaignsMap[blockName];

					const areasList = Array.isArray(block.Areas?.AreaStats) ? block.Areas.AreaStats : [];
					for (const area of areasList) {
						const sid = String(area?.["@_SID"] ?? "");
						if (!sid) continue;

						if (!chaptersMap[sid]) {
							chaptersMap[sid] = { sid, name: null, iconPath: null, sides: {} };
						}

						const modes = Array.isArray(area.Modes?.AreaModeStats) ? area.Modes.AreaModeStats : [];
						for (let idx = 0; idx < modes.length; idx++) {
							const mode = modes[idx];
							if (!mode) continue;
							const sideName = idx === 0 ? "A" : idx === 1 ? "B" : "C";

							const completed = mode["@_Completed"] === "true" || mode["@_Completed"] === true;
							const deaths = Number(mode["@_Deaths"] ?? 0);
							const playTimeMs = Math.round(Number(mode["@_TimePlayed"] ?? 0) / 10000);
							const bestDeaths = Number(mode["@_BestDeaths"] ?? 0);
							const bestDashes = Number(mode["@_BestDashes"] ?? 0);
							const heartCollected = mode["@_HeartGem"] === "true" || mode["@_HeartGem"] === true;
							const strawberriesList = Array.isArray(mode.Strawberries?.EntityID) ? mode.Strawberries.EntityID : [];

							const hasActivity = completed || deaths > 0 || playTimeMs > 0 || heartCollected || strawberriesList.length > 0;
							if (!hasActivity) continue;

							global.deaths += deaths;
							global.playTimeMs += playTimeMs;
							campaignStats.deaths += deaths;
							campaignStats.playTimeMs += playTimeMs;

							if (heartCollected) {
								global.hearts.current += 1;
								campaignStats.hearts.current += 1;
							}
							global.redStrawberries.current += strawberriesList.length;
							campaignStats.redStrawberries.current += strawberriesList.length;

							chaptersMap[sid].sides[sideName] = {
								side: sideName,
								completed,
								singleRunCompleted: mode["@_SingleRunCompleted"] === "true" || mode["@_SingleRunCompleted"] === true,
								fullClear: mode["@_FullClear"] === "true" || mode["@_FullClear"] === true,
								deaths,
								playTimeMs,
								bestTimeMs: Math.round(Number(mode["@_BestTime"] ?? 0) / 10000),
								bestFullClearTimeMs: Math.round(Number(mode["@_BestFullClearTime"] ?? 0) / 10000),
								bestDashes,
								bestDeaths,
								heartCollected,
								berriesCollected: strawberriesList.length,
								berriesAvailable: 0,
							};
						}
					}
				}
			}
		} catch (e: unknown) {
			Log_Error("LocalMods.ts:", `| Failed to parse standalone mod save stats for slot ${slot.slotNumber} |`, serializeError(e));
		}

		let minDeathsSum = 0;
		for (const summary of Object.values(chaptersMap)) {
			for (const side of Object.values(summary.sides)) {
				if (side.completed && side.bestDeaths >= 0) {
					minDeathsSum += side.bestDeaths;
				}
			}
		}
		global.minimumDeaths = minDeathsSum;

		return {
			modId,
			humanName,
			isVanilla: false,
			isLobbyMod: false,
			saveSlot: slot.slotNumber,
			saveWideDashes,
			saveWideJumps,
			global,
			campaigns: campaignsMap,
			chapters: chaptersMap,
		};
	}

	public async destroy() {
		await this.storage.triggerSave();
		this.storage.destroy();
	}
}
