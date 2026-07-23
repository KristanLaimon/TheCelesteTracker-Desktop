// UNIVERSAL COMPATIBILITY
import { serializeError } from "serialize-error";
import { injectable } from "tsyringe";
import type Everest from "./Everest";
import type { EverestModInfo } from "./Everest";
import type GameBananaApi from "./GameBananaAPI";
import type { GbMemberApi_Reponse } from "./GameBananaAPI";
import { Log_Error, Log_Info } from "./Logger";
import type MaddiesApi from "./MaddiesAPI";
import type { MaddiesApiModInfo } from "./MaddiesAPI";
import type Storage from "./Storage";

const STORAGE_KEY_ALL_EVEREST_MODS_INFO = "localmods_allInstalled";
const STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO = "LocalMods_Map_ModId_To_MaddiesInfo";
const STORAGE_KEY_MAP_EVEREST_MOD_ID_TO_AUTHOR_INFO = "LocalMods_Map_ModId_To_AuthorInfo";

export type LocalModsOptions = {
	invalidateCache?: {
		ALL_EVEREST_MODS_INFO?: boolean;
		EVERESTMODID_TO_MADDIESMODINFO?: boolean;
		EVERESTMODID_TO_AUTHORINFO?: boolean;
	};
};

export type ModSimplified = {
	humanNameMod: string;
	modId: string;
};

@injectable()
export default class DBMods {
	constructor(
		private everest: Everest,
		private storage: Storage,
		private maddiesApi: MaddiesApi,
		private gameBananaApi: GameBananaApi,
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

	public async destroy() {
		await this.storage.triggerSave();
		this.storage.destroy();
	}
}
