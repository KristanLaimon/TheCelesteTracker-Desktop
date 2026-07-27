// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import { CTDB_Token } from "../../core/interfaces/DependencyInjectionTokens";
import type { EverestModInfo } from "../../domain/Everest";
import { dbLogger, logger } from "../../utils/Logger";
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
		if (!modInfo.metadata.isMapMod) return null;
		if (modInfo.metadata.isLobby) return null;
		if (modInfo.metadata.campaigns.length === 0) return null;

		//Is normally one campaign and that's it for standalone mod maps (with multiple chapters of course, from 1..n)
		// Campaign SID FORMAT: "BeefyUncleTorre/map" or "Crylone/farshore" for Glpyh and Farshore respectively.
		const campaign = modInfo.metadata.campaigns[0];
		const toReturn = await this.GetAllSessionsFromCampaignSID(saveSlotData, campaign.campaignNameId, opts);
		return toReturn;
	}

	private async GetAllSessionsFromCampaignSID(saveSlotData: number, campaignSID: string, opts?: { limit: number }) {
		try {
			// biome-ignore format: Increases readibility this way
			let query = this.db
				.selectFrom("GameSessions")
				.selectAll()
				.leftJoin("Chapters", "Chapters.sid", "GameSessions.chapter_sid")
				.leftJoin("Campaigns", "Campaigns.id", "Chapters.campaign_id")
				.orderBy("GameSessions.date_time_start", "desc")
				.where('GameSessions.chapter_sid', "like", `%${campaignSID}%`)
				.where("Campaigns.save_data_id", "=", saveSlotData);

			logger.fatal({ result: await query.execute(), saveSlotData });

			if (opts?.limit) query = query.limit(opts.limit);
			return await query.execute();
		} catch (error) {
			dbLogger.error(`GameSessions.GetSessionsByLevelSet failed: ${error}`);
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
