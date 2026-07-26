import { inject, injectable } from "tsyringe";
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

@injectable()
export default class DBMods {
	private scanner: LocalModsScanner;
	private enricher: LocalModsMetadataEnricher;
	private history: LocalModsHistoryManager;
	private stats: LocalModsStatsCalculator;

	constructor(
		everest: Everest,
		private storage: Storage,
		maddiesApi: MaddiesApi,
		gameBananaApi: GameBananaApi,
		olympus: Olympus,
		@inject(IFileSystem_Token) fs: IFileSystem,
		celeste: Celeste,
	) {
		storage.configureAutoSave("turn off");

		this.scanner = new LocalModsScanner(everest, storage);
		this.enricher = new LocalModsMetadataEnricher(this.scanner, storage, maddiesApi, gameBananaApi);
		this.history = new LocalModsHistoryManager(this.scanner, this.enricher, everest, olympus, storage, fs);
		this.stats = new LocalModsStatsCalculator(this.scanner, celeste, everest, fs);
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
		await this.storage.triggerSave();
		this.storage.destroy();
	}
}
