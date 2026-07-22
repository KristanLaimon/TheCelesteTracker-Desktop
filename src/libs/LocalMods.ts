// UNIVERSAL COMPATIBILITY
import { serializeError } from 'serialize-error';
import { injectable } from 'tsyringe';
import type Everest from './Everest';
import type { EverestModInfo } from './Everest';
import type GameBananaApi from './GameBananaAPI';
import type { GbMemberApi_Reponse } from './GameBananaAPI';
import { Log_Error, Log_Info } from './Logger';
import type MaddiesApi from './MaddiesAPI';
import type { MaddiesApiModInfo } from './MaddiesAPI';
import type Storage from './Storage';

const STORAGE_KEY_ALL_EVEREST_MODS_INFO = 'localmods_allInstalled';
const STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO = 'LocalMods_Map_ModId_To_MaddiesInfo';
const STORAGE_KEY_MAP_HUMANNAME_TO_EVEREST_MOD_ID = 'LocalMods_Map_HumanName_To_ModId';
const STORAGE_KEY_MAP_EVEREST_MOD_ID_TO_AUTHOR_INFO = 'LocalMods_Map_ModId_To_AuthorInfo';

export type LocalModsOptions = {
	invalidateCache: {
		ALL_EVEREST_MODS_INFO?: boolean;
		EVERESTMODID_TO_MADDIESMODINFO?: boolean;
		HUMANNAME_TO_EVEREST_MOD_ID?: boolean;
		EVERESTMODID_TO_AUTHORINFO?: boolean;
	};
};

@injectable()
export default class DBMods {
	constructor(
		private everest: Everest,
		private storage: Storage,
		private maddiesApi: MaddiesApi,
		private gameBananaApi: GameBananaApi,
	) {
		storage.configureAutoSave('turn off');
	}

	async #GetMap_HumanName_EverestModId(opts?: LocalModsOptions): Promise<Record<string, string>> {
		type Map_HumanName_EverestModId = Record<string, string>;

		return await this.storage.get<Map_HumanName_EverestModId>(
			STORAGE_KEY_MAP_HUMANNAME_TO_EVEREST_MOD_ID,
			async () => {
				const allMods = await this.EverestMods_GetAll(opts);
				const toReturn: Map_HumanName_EverestModId = {};
				for (const mod of Object.values(allMods)) {
					if (mod.humanName && mod.humanName.trim() !== '') toReturn[mod.humanName] = mod.metadata.name;
				}
				return toReturn;
			},
			{ invalidateCache: opts?.invalidateCache.HUMANNAME_TO_EVEREST_MOD_ID },
		);
	}

	public async EverestMods_GetAll(opts?: LocalModsOptions): Promise<Record<string, EverestModInfo>> {
		Log_Info('LocalMods.ts:', 'About to load all mods full!');
		const toReturn = await this.storage.get<Record<string, EverestModInfo>>(
			STORAGE_KEY_ALL_EVEREST_MODS_INFO,
			async () => {
				const allMods = await this.everest.GetModsInstalledFull({ workerCount: 4 });
				const map: Record<string, EverestModInfo> = {};
				for (const mod of allMods) {
					if (mod.metadata.name && mod.metadata.name.trim() !== '') {
						map[mod.metadata.name] = mod;
					}
				}
				return map;
			},
			{ invalidateCache: opts?.invalidateCache.ALL_EVEREST_MODS_INFO },
		);
		Log_Info('LocalMods.ts:', 'All mods info loaded');
		return toReturn;
	}

	public async EverestMods_Get_ModByHumanName(modHumanName: string, opts?: LocalModsOptions): Promise<EverestModInfo | null> {
		const humanName_To_EverestIdOnly = await this.#GetMap_HumanName_EverestModId(opts);
		const allMods = await this.EverestMods_GetAll(opts);

		const foundModIdOnly = humanName_To_EverestIdOnly[modHumanName];
		if (!foundModIdOnly) {
			return null;
		}
		const foundModFullyInfo = allMods[foundModIdOnly];
		return foundModFullyInfo ?? null;
	}

	public async EverestMods_Get_ListHumanName(opts?: LocalModsOptions): Promise<string[]> {
		const allMods = await this.#GetMap_HumanName_EverestModId(opts);
		return Object.keys(allMods).filter((k) => k && k !== 'undefined');
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
							const searchResults = await this.maddiesApi.SearchModByName(mod.humanName);
							const bestMatch = searchResults[0];
							if (!bestMatch) return null;

							return { everestModId, maddiesInfo: bestMatch };
						} catch (e: unknown) {
							Log_Error('LocalMods.ts:', '(Maddies MULTIPLE FETCH) | When trying to fetch maddies api info, got error | Error =>', serializeError(e));
							throw e;
						}
					}),
				);

				const map: Map_EverestModId_MaddiesModInfo = {};
				for (const result of settledResults) {
					if (result.status !== 'fulfilled' || result.value === null) continue;
					map[result.value.everestModId] = result.value.maddiesInfo;
				}

				return map;
			},
			{ invalidateCache: opts?.invalidateCache.EVERESTMODID_TO_MADDIESMODINFO },
		);
	}

	public async MaddiesApi_GetAll(opts?: LocalModsOptions): Promise<MaddiesApiModInfo[]> {
		const res = await this.#GetMap_EverestModId_MaddiesMod(opts);
		return Object.values(res);
	}

	public async MaddiesApi_Get_ModByHumanName(modHumanName: string, opts?: LocalModsOptions): Promise<MaddiesApiModInfo | null> {
		const cachedMap = await this.storage.get<Record<string, MaddiesApiModInfo>>(STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO);
		let modInfo: MaddiesApiModInfo | null = null;
		if (cachedMap) {
			const humanNameMap = await this.#GetMap_HumanName_EverestModId(opts);
			const everestModId = humanNameMap[modHumanName];
			if (everestModId) modInfo = cachedMap[everestModId] ?? null;
		} else {
			try {
				//Fallback: search manually this mod only and
				const _allFound = await this.maddiesApi.SearchModByName(modHumanName);
				if (_allFound && _allFound.length > 0) {
					modInfo = _allFound[0];
				}
			} catch (e: unknown) {
				Log_Error('LocalMods.ts:', '| (Maddies SINGLE FETCH) When trying to fetch maddies api info, got error | Error =>', serializeError(e));
			}
			modInfo = null;

			//fetch the rest of mods info in background while returning this!
			this.#GetMap_EverestModId_MaddiesMod(opts);
		}
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
			{ invalidateCache: opts?.invalidateCache.EVERESTMODID_TO_AUTHORINFO },
		);
	}

	public async GameBananaApi_GetAuthorInfoByAuthorName(_authorName: string): Promise<object | null> {
		// const cachedMap = await this.storage.get<string, GbMemberApi_Reponse>(STROAGE_);
		//almost same logic as MaddiesApi_Get_ModByHumanName...
	}

	public async destroy() {
		await this.storage.triggerSave();
		this.storage.destroy();
	}
}
