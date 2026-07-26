import type { IFileSystem } from "../../core/interfaces/IFileSystem";
import { AsyncLazy } from "../../utils/AsyncLazy";
import type Storage from "../../utils/Storage";
import type Everest from "../Everest";
import type { EverestModInfo } from "../Everest";
import { GetLevelSetNamesForMod } from "../Everest";
import type Olympus from "../Olympus";
import type { HistoricalModEntry, LocalModsOptions, ModDbEntry } from "./LocalMods.types";
import type { LocalModsMetadataEnricher } from "./LocalModsMetadataEnricher";
import type { LocalModsScanner } from "./LocalModsScanner";

const STORAGE_KEY_HISTORICAL_UNINSTALLED_MODS = "LocalMods_HistoricalUninstalledMods";

export class LocalModsHistoryManager {
	#historicalModsLazy = new AsyncLazy((opts?: LocalModsOptions) =>
		this.storage.get<Record<string, HistoricalModEntry>>(STORAGE_KEY_HISTORICAL_UNINSTALLED_MODS, () => this.#ComputeHistoricalMods(opts), {
			invalidateCache: opts?.invalidateCache?.HISTORICAL_UNINSTALLED_MODS,
		}),
	);

	constructor(
		private scanner: LocalModsScanner,
		private enricher: LocalModsMetadataEnricher,
		private everest: Everest,
		private olympus: Olympus,
		private storage: Storage,
		private fs: IFileSystem,
	) {}

	public async ResolveModCategory(modId: string, opts?: LocalModsOptions): Promise<string | null> {
		const olympusAvailable = await this.olympus.isInstalled();
		if (olympusAvailable) {
			return await this.olympus.GetModCategoryByModId(modId).catch(() => null);
		}
		const maddiesInfo = await this.enricher.MaddiesApi_Get_ModByModId(modId, opts).catch(() => null);
		return maddiesInfo?.CategoryName ?? null;
	}

	async #ComputeHistoricalMods(opts?: LocalModsOptions): Promise<Record<string, HistoricalModEntry>> {
		const installedMods = await this.scanner.EverestMods_GetAll(opts);
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
		const cachedMods = await this.scanner.EverestMods_GetAll(opts);
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
}
