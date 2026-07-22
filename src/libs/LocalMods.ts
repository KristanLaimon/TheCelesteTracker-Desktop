// UNIVERSAL COMPATIBILITY
import { serializeError } from 'serialize-error';
import { injectable } from 'tsyringe';
import type Everest from './Everest';
import type { EverestModInfo } from './Everest';
import type GameBananaApi from './GameBananaAPI';
import { Log_Error, Log_Info } from './Logger';
import type MaddiesApi from './MaddiesAPI';
import type { MaddiesApiModInfo } from './MaddiesAPI';
import type Storage from './Storage';

const STORAGE_KEY_ALL_EVEREST_MODS_INFO = 'localmods_allInstalled';
const STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO = 'LocalMods_Map_ModId_To_MaddiesInfo';
const STORAGE_KEY_MAP_HUMANNAME_TO_EVEREST_MOD_ID = 'LocalMods_Map_HumanName_To_ModId';

export type LocalModsOptions = {
	invalidateCache: {
		ALL_EVEREST_MODS_INFO?: boolean;
		EVERESTMODID_TO_MADDIESMODINFO?: boolean;
		HUMANNAME_TO_EVEREST_MOD_ID?: boolean;
	};
};

@injectable()
export default class LocalMods {
	constructor(
		private everest: Everest,
		private storage: Storage,
		private maddiesApi: MaddiesApi,
		private gameBananaApi: GameBananaApi,
	) {
		storage.configureAutoSave('turn off');
	}

	async #EverestMods_GetMap_HumanName_EverestModId(opts?: LocalModsOptions): Promise<Record<string, string>> {
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

	async #MaddiesAPI_GetSingleModInfo_ByModHumanName(humanName: string): Promise<MaddiesApiModInfo | null> {
		try {
			const allCoincidencesFound = await this.maddiesApi.SearchModByName(humanName);
			if (allCoincidencesFound && allCoincidencesFound.length > 0) {
				return allCoincidencesFound[0];
			}
		} catch (e: unknown) {
			Log_Error('LocalMods.ts:', '| (Maddies SINGLE FETCH) When trying to fetch maddies api info, got error | Error =>', serializeError(e));
		}
		return null;
	} //i want to get single mod

	async #MaddiesAPI_GetMap_EverestModId_MaddiesModInfo(opts?: LocalModsOptions) {
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

	public async MaddiesApi_GetModInfoByModHumanName(modHumanName: string, opts?: LocalModsOptions): Promise<MaddiesApiModInfo | null> {
		const cachedMap = await this.storage.get<Record<string, MaddiesApiModInfo>>(STORAGE_KEY_MAP_EVERESTMODID_TO_MADDIESMODINFO);

		if (cachedMap) {
			const humanNameMap = await this.#EverestMods_GetMap_HumanName_EverestModId(opts);
			const everestModId = humanNameMap[modHumanName];
			if (everestModId) return cachedMap[everestModId] ?? null;
			return null;
		}

		const singleResult = await this.#MaddiesAPI_GetSingleModInfo_ByModHumanName(modHumanName);
		this.#MaddiesAPI_GetMap_EverestModId_MaddiesModInfo(opts);
		return singleResult;
	}

	public async EverestMods_GetModInfoByHumanName(modHumanName: string, opts?: LocalModsOptions): Promise<EverestModInfo | null> {
		const humanName_To_EverestIdOnly = await this.#EverestMods_GetMap_HumanName_EverestModId(opts);
		const allMods = await this.EverestMods_GetAll(opts);

		const foundModIdOnly = humanName_To_EverestIdOnly[modHumanName];
		if (!foundModIdOnly) {
			return null;
		}
		const foundModFullyInfo = allMods[foundModIdOnly];
		return foundModFullyInfo ?? null;
	}

	public async EverestMods_GetListHumanName(opts?: LocalModsOptions): Promise<string[]> {
		const allMods = await this.#EverestMods_GetMap_HumanName_EverestModId(opts);
		return Object.keys(allMods).filter((k) => k && k !== 'undefined');
	}

	public async destroy() {
		await this.storage.triggerSave();
		this.storage.destroy();
	}
}
