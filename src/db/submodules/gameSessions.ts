// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import { CTDB_Token } from "../../core/interfaces/DependencyInjectionTokens";
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
