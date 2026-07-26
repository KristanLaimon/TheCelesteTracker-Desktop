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
}
