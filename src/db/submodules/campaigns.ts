// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import { CTDB_Token } from "../../core/interfaces/DependencyInjectionTokens";
import { dbLogger } from "../../utils/Logger";
import type { Campaign, Database } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_Campaigns extends TableSubmodule<"Campaigns"> {
	constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "Campaigns");
	}

	public async GetById(id: number): Promise<Campaign | null> {
		try {
			return (await this.db.selectFrom("Campaigns").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			dbLogger.error(`Campaigns.GetById failed: ${error}`);
			return null;
		}
	}
}
