// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import { CTDB_Token } from "@core/interfaces/DependencyInjectionTokens";
import { Log_Error } from "@utils/Logger";
import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import type { Database, Lobby } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_Lobbies extends TableSubmodule<"Lobbies"> {
	constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "Lobbies");
	}

	public async GetById(id: number): Promise<Lobby | null> {
		try {
			return (await this.db.selectFrom("Lobbies").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			Log_Error(`Lobbies.GetById failed: ${error}`);
			return null;
		}
	}
}
