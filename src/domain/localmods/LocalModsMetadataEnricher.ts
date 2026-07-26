import { serializeError } from "serialize-error";
import type GameBananaApi from "../../api/GameBananaAPI";
import type { GbMemberApi_Reponse } from "../../api/GameBananaAPI";
import type MaddiesApi from "../../api/MaddiesAPI";
import type { MaddiesApiModInfo } from "../../api/MaddiesAPI";
import { AsyncLazy } from "../../utils/AsyncLazy";
import { modScannerLogger } from "../../utils/Logger";
import type Storage from "../../utils/Storage";
import type { LocalModsOptions } from "./LocalMods.types";
import type { LocalModsScanner } from "./LocalModsScanner";

const STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO = "LocalMods_Map_ModId_To_MaddiesInfo";
const STORAGE_KEY_MAP_EVEREST_MOD_ID_TO_AUTHOR_INFO = "LocalMods_Map_ModId_To_AuthorInfo";

export class LocalModsMetadataEnricher {
	#maddiesMapLazy = new AsyncLazy((opts?: LocalModsOptions) => {
		type Map_EverestModId_MaddiesModInfo = Record<string, MaddiesApiModInfo>;

		return this.storage.get<Map_EverestModId_MaddiesModInfo>(
			STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO,
			async () => {
				const allMods = await this.scanner.EverestMods_GetAll(opts);
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
							modScannerLogger.error(
								"LocalModsMetadataEnricher: (Maddies MULTIPLE FETCH) | When trying to fetch maddies api info, got error",
								serializeError(e),
							);
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
				const modIdToMod = await this.GetMap_EverestModId_MaddiesMod(opts);
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

	constructor(
		private scanner: LocalModsScanner,
		private storage: Storage,
		private maddiesApi: MaddiesApi,
		private gameBananaApi: GameBananaApi,
	) {}

	public async GetMap_EverestModId_MaddiesMod(opts?: LocalModsOptions): Promise<Record<string, MaddiesApiModInfo>> {
		return await this.#maddiesMapLazy.get(opts, { forceRefresh: opts?.invalidateCache?.EVERESTMODID_TO_MADDIESMODINFO });
	}

	public async MaddiesApi_GetAll(opts?: LocalModsOptions): Promise<MaddiesApiModInfo[]> {
		const res = await this.GetMap_EverestModId_MaddiesMod(opts);
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
			modScannerLogger.error(`LocalModsMetadataEnricher: (${options.logContext}) When trying to fetch single info, got error`, serializeError(e));
		}

		options.backgroundPopulateFn();
		return item;
	}

	public async MaddiesApi_Get_ModByModId(modId: string, opts?: LocalModsOptions): Promise<MaddiesApiModInfo | null> {
		const modInfo = await this.#GetSingleOrFetchBackground<MaddiesApiModInfo>({
			storageKey: STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO,
			lookupKey: modId,
			singleFetchFn: async () => {
				const allMods = await this.scanner.EverestMods_GetAll(opts);
				const mod = allMods[modId];
				const searchName = mod?.humanName || modId;
				const _allFound = await this.maddiesApi.SearchModByName(searchName);
				return _allFound?.[0] ?? null;
			},
			backgroundPopulateFn: () => this.GetMap_EverestModId_MaddiesMod(opts),
			logContext: "Maddies SINGLE FETCH",
		});
		return await this.maddiesApi.ResolveAndInjectModScreenshotsSrcsInto(modInfo);
	}

	public async GetMap_EverestModId_GameBananaAuthor(opts?: LocalModsOptions): Promise<Record<string, GbMemberApi_Reponse>> {
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
			backgroundPopulateFn: () => this.GetMap_EverestModId_GameBananaAuthor(opts),
			logContext: "GameBanana Author SINGLE FETCH",
		});
	}
}
