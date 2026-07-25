// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import { CTDB_Token } from "@core/interfaces/DependencyInjectionTokens";
import { Log_Error } from "@utils/Logger";
import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import type { Database, GameSession } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_GameSessions extends TableSubmodule<"GameSessions"> {
	constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "GameSessions");
	}

	public async GetById(id: string): Promise<GameSession | null> {
		try {
			return (await this.db.selectFrom("GameSessions").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			Log_Error(`GameSessions.GetById failed: ${error}`);
			return null;
		}
	}
}
