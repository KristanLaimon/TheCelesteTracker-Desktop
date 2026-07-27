import { AsyncLazy } from "../../utils/AsyncLazy";
import { modScannerLogger } from "../../utils/Logger";
import type Storage from "../../utils/Storage";
import type Everest from "../Everest";
import type { EverestModInfo } from "../Everest";
import type { LocalModsOptions, ModSimplified } from "./LocalMods.types";

const STORAGE_KEY_ALL_EVEREST_MODS_INFO = "localmods_allInstalled";

export class LocalModsScanner {
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

	constructor(
		private everest: Everest,
		private storage: Storage,
	) {}

	public async EverestMods_GetAll(opts?: LocalModsOptions): Promise<Record<string, EverestModInfo>> {
		// modScannerLogger.info("Fetching ");
		const toReturn = await this.#everestModsLazy.get(opts, { forceRefresh: opts?.invalidateCache?.ALL_EVEREST_MODS_INFO });
		// modScannerLogger.info(`Loaded ${Object.keys(toReturn).length} installed mods into scanner cache.`);
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
}
