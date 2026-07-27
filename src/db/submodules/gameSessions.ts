// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import { CTDB_Token } from "../../core/interfaces/DependencyInjectionTokens";
import type { EverestModInfo } from "../../domain/Everest";
import { dbLogger } from "../../utils/Logger";
import type { Database, GameSession } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class Submodule_GameSessions extends TableSubmodule<"GameSessions"> {
	public constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "GameSessions");
	}

	public async GetById(id: string): Promise<GameSession | null> {
		try {
			return (await this.db.selectFrom("GameSessions").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			dbLogger.error(`GameSessions.GetById failed: ${error}`);
			return null;
		}
	}

	public async GetLastSessionsFromStandaloneModMap(saveSlotData: number, modInfo: EverestModInfo, opts?: { limit: number }) {
		if (!modInfo) return null;
		if (!modInfo.metadata?.isMapMod) return null;
		if (modInfo.metadata?.isLobby) return null;
		if (!modInfo.metadata?.campaigns || modInfo.metadata.campaigns.length === 0) return null;

		const campaignSIDs = modInfo.metadata.campaigns.map((c) => c.campaignNameId).filter((id): id is string => Boolean(id));

		if (campaignSIDs.length === 0) return [];
		return await this.GetAllSessionsFromCampaignSIDs(saveSlotData, campaignSIDs, opts);
	}

	public async GetAllSessionsFromCampaignSIDs(saveSlotData: number, campaignSIDs: string[], opts?: { limit: number }) {
		try {
			if (!campaignSIDs || campaignSIDs.length === 0) return [];
			// biome-ignore format: Increases readibility this way
			let query = this.db
				.selectFrom("GameSessions")
				.selectAll("GameSessions")
				.leftJoin("Chapters", "Chapters.sid", "GameSessions.chapter_sid")
				.leftJoin("Campaigns", "Campaigns.id", "Chapters.campaign_id")
				.leftJoin("SaveDatas", "SaveDatas.id", "Campaigns.save_data_id")
				.orderBy("GameSessions.date_time_start", "desc")
				.where((eb) => eb.or(campaignSIDs.map((sid) => eb("GameSessions.chapter_sid", "like", `%${sid}%`))))
				.where((eb) =>
					eb.or([
						eb("SaveDatas.slot_number", "=", saveSlotData),
						eb("Campaigns.save_data_id", "=", saveSlotData),
					]),
				);

			if (opts?.limit) query = query.limit(opts.limit);
			return await query.execute();
		} catch (error) {
			dbLogger.error(`GameSessions.GetAllSessionsFromCampaignSIDs failed: ${error}`);
			return [];
		}
	}

	public async GetSessionsByLevelSet(opts: { levelSetNames: string[]; limit?: number }): Promise<GameSession[]> {
		try {
			if (!opts.levelSetNames || opts.levelSetNames.length === 0) return [];
			let query = this.db.selectFrom("GameSessions").selectAll().orderBy("date_time_start", "desc");
			query = query.where((eb) => eb.or(opts.levelSetNames.map((name) => eb("chapter_sid", "like", `%${name}%`))));
			if (opts.limit && opts.limit > 0) {
				query = query.limit(opts.limit);
			}
			return await query.execute();
		} catch (error) {
			dbLogger.error(`GameSessions.GetSessionsByLevelSet failed: ${error}`);
			return [];
		}
	}
}
