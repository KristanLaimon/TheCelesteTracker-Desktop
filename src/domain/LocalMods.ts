import { inject, injectable } from "tsyringe";
// biome-ignore lint/style/useImportType: DI token needed at runtime
import Zip_Go from "../../dependencies/exports/Zip_Go";
import type GameBananaApi from "../api/GameBananaAPI";
import type { GbMemberApi_Reponse } from "../api/GameBananaAPI";
import type MaddiesApi from "../api/MaddiesAPI";
import type { MaddiesApiModInfo } from "../api/MaddiesAPI";
import { IFileSystem_Token } from "../core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../core/interfaces/IFileSystem";
import type Storage from "../utils/Storage";
import type Celeste from "./Celeste";
import type Everest from "./Everest";
import type { EverestModInfo } from "./Everest";
import type { GetModStatsOptions, HistoricalModEntry, LocalModsOptions, ModDbEntry, ModSimplified, ModStatisticsResult } from "./localmods/LocalMods.types";
import { LocalModsHistoryManager } from "./localmods/LocalModsHistoryManager";
import { LocalModsMetadataEnricher } from "./localmods/LocalModsMetadataEnricher";
import { LocalModsScanner } from "./localmods/LocalModsScanner";
import { LocalModsStatsCalculator } from "./localmods/LocalModsStatsCalculator";
import type Olympus from "./Olympus";

export * from "./localmods/LocalMods.types";

/** One `Storage` per split `mods-*.json` cache file, see `Construct_LocalMods`. */
export interface DBModsStorages {
	installed: Storage;
	historical: Storage;
	enrichment: Storage;
	collectibleTotals: Storage;
}

@injectable()
export default class DBMods {
	private scanner: LocalModsScanner;
	private enricher: LocalModsMetadataEnricher;
	private history: LocalModsHistoryManager;
	private stats: LocalModsStatsCalculator;
	private storages: Storage[];

	constructor(
		everest: Everest,
		storages: DBModsStorages,
		maddiesApi: MaddiesApi,
		gameBananaApi: GameBananaApi,
		olympus: Olympus,
		@inject(IFileSystem_Token) fs: IFileSystem,
		celeste: Celeste,
		@inject(Zip_Go) zip: Zip_Go,
	) {
		this.storages = [storages.installed, storages.historical, storages.enrichment, storages.collectibleTotals];
		for (const storage of this.storages) storage.configureAutoSave("turn off");

		this.scanner = new LocalModsScanner(everest, storages.installed);
		this.enricher = new LocalModsMetadataEnricher(this.scanner, storages.enrichment, maddiesApi, gameBananaApi);
		this.history = new LocalModsHistoryManager(this.scanner, this.enricher, everest, olympus, storages.historical, fs);
		this.stats = new LocalModsStatsCalculator(this.scanner, celeste, everest, fs, zip, storages.collectibleTotals);
	}

	// ============ EVEREST MOD SCANNING ================

	public async EverestMods_GetAll(opts?: LocalModsOptions): Promise<Record<string, EverestModInfo>> {
		return await this.scanner.EverestMods_GetAll(opts);
	}

	public async EverestMods_Get_ModByModId(modId: string, opts?: LocalModsOptions): Promise<EverestModInfo | null> {
		return await this.scanner.EverestMods_Get_ModByModId(modId, opts);
	}

	public async EverestMods_Get_ListModIds(opts?: LocalModsOptions): Promise<string[]> {
		return await this.scanner.EverestMods_Get_ListModIds(opts);
	}

	public async EverestMods_Get_ListModSimplified(opts?: LocalModsOptions): Promise<ModSimplified[]> {
		return await this.scanner.EverestMods_Get_ListModSimplified(opts);
	}

	// ============ MADDIES & GAMEBANANA API ENRICHMENT ================

	public async MaddiesApi_GetAll(opts?: LocalModsOptions): Promise<MaddiesApiModInfo[]> {
		return await this.enricher.MaddiesApi_GetAll(opts);
	}

	public async MaddiesApi_Get_ModByModId(modId: string, opts?: LocalModsOptions): Promise<MaddiesApiModInfo | null> {
		return await this.enricher.MaddiesApi_Get_ModByModId(modId, opts);
	}

	public async GameBananaApi_GetAuthorInfoByModId(modId: string, opts?: LocalModsOptions): Promise<GbMemberApi_Reponse | null> {
		return await this.enricher.GameBananaApi_GetAuthorInfoByModId(modId, opts);
	}

	// ============ CATEGORY & HISTORICAL MODS ================

	public async ResolveModCategory(modId: string, opts?: LocalModsOptions): Promise<string | null> {
		return await this.history.ResolveModCategory(modId, opts);
	}

	public async HistoricalMods_GetAll(opts?: LocalModsOptions): Promise<Record<string, HistoricalModEntry>> {
		return await this.history.HistoricalMods_GetAll(opts);
	}

	public async Mods_GetAllWithHistory(opts?: LocalModsOptions): Promise<ModDbEntry[]> {
		return await this.history.Mods_GetAllWithHistory(opts);
	}

	public async Mods_GetAllHistorical(opts?: LocalModsOptions): Promise<ModDbEntry[]> {
		return await this.history.Mods_GetAllHistorical(opts);
	}

	// ============ GAMEPLAY STATISTICS RETRIEVAL BY MOD ================

	public async GetStatisticsByModId(modId: string, opts: GetModStatsOptions): Promise<ModStatisticsResult> {
		return await this.stats.GetStatisticsByModId(modId, opts);
	}

	public async destroy() {
		await Promise.all(this.storages.map((storage) => storage.triggerSave()));
		for (const storage of this.storages) storage.destroy();
	}
}
