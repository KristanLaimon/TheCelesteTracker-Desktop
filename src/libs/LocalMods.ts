// UNIVERSAL COMPATIBILITY
import { serializeError } from "serialize-error";
import { inject, injectable } from "tsyringe";
import { IFileSystem_Token } from "../interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../interfaces/IFileSystem";
import type Everest from "./Everest";
import type { EverestModInfo } from "./Everest";
import { GetLevelSetNamesForMod } from "./Everest";
import type GameBananaApi from "./GameBananaAPI";
import type { GbMemberApi_Reponse } from "./GameBananaAPI";
import { Log_Error, Log_Info } from "./Logger";
import type MaddiesApi from "./MaddiesAPI";
import type { MaddiesApiModInfo } from "./MaddiesAPI";
import type Olympus from "./Olympus";
import type Storage from "./Storage";

const STORAGE_KEY_ALL_EVEREST_MODS_INFO = "localmods_allInstalled";
const STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO = "LocalMods_Map_ModId_To_MaddiesInfo";
const STORAGE_KEY_MAP_EVEREST_MOD_ID_TO_AUTHOR_INFO = "LocalMods_Map_ModId_To_AuthorInfo";
const STORAGE_KEY_HISTORICAL_UNINSTALLED_MODS = "LocalMods_HistoricalUninstalledMods";

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

@injectable()
export default class DBMods {
	constructor(
		private everest: Everest,
		private storage: Storage,
		private maddiesApi: MaddiesApi,
		private gameBananaApi: GameBananaApi,
		private olympus: Olympus,
		@inject(IFileSystem_Token) private fs: IFileSystem,
	) {
		storage.configureAutoSave("turn off");
	}

	public async EverestMods_GetAll(opts?: LocalModsOptions): Promise<Record<string, EverestModInfo>> {
		Log_Info("LocalMods.ts:", "About to load all mods full!");
		const toReturn = await this.storage.get<Record<string, EverestModInfo>>(
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
		);
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
		type Map_EverestModId_MaddiesModInfo = Record<string, MaddiesApiModInfo>;

		return await this.storage.get<Map_EverestModId_MaddiesModInfo>(
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
		type MapType = Record<string, GbMemberApi_Reponse>;
		return await this.storage.get<MapType>(
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

	/**
	 * Resolves a mod's category: `Olympus` (offline) when installed, Maddies' online
	 * `CategoryName` as a last-resort fallback when it isn't. Returns `null` (never throws)
	 * if neither source has an answer — caller decides what "uncategorized" means to it.
	 */
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

	/**
	 * Mods found only via a save file's `<LevelSetRecycleBin>` — never scanned by this app,
	 * so best-effort identified by the root `/`-segment of the raw `LevelSetStats Name`.
	 * Storage-cached: expensive to compute (save-file reads + XML parse + category
	 * resolution), comparatively stable, so it's remembered indefinitely until invalidated.
	 */
	public async HistoricalMods_GetAll(opts?: LocalModsOptions): Promise<Record<string, HistoricalModEntry>> {
		return await this.storage.get<Record<string, HistoricalModEntry>>(STORAGE_KEY_HISTORICAL_UNINSTALLED_MODS, () => this.#ComputeHistoricalMods(opts), {
			invalidateCache: opts?.invalidateCache?.HISTORICAL_UNINSTALLED_MODS,
		});
	}

	/**
	 * Every mod this player has or has had, installed or not:
	 * - Cached Everest mods still present on disk (installed).
	 * - Cached Everest mods whose file no longer exists — a cheap `fs.exists` freshness
	 *   check on top of the (possibly stale) scan cache, catches uninstalls the cache
	 *   doesn't know about yet without a full re-scan.
	 * - Mods the cache never saw at all, recovered from `HistoricalMods_GetAll`.
	 */
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

	public async destroy() {
		await this.storage.triggerSave();
		this.storage.destroy();
	}
}
