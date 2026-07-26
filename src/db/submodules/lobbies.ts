// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import { CTDB_Token } from "../../core/interfaces/DependencyInjectionTokens";
import { dbLogger } from "../../utils/Logger";
import type { Database, Lobby } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class Submodule_Lobbies extends TableSubmodule<"Lobbies"> {
	public constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "Lobbies");
	}

	public async GetById(id: number): Promise<Lobby | null> {
		try {
			return (await this.db.selectFrom("Lobbies").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			dbLogger.error(`Lobbies.GetById failed: ${error}`);
			return null;
		}
	}
}
