// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import { CTDB_Token } from "../../core/interfaces/DependencyInjectionTokens";
import { dbLogger } from "../../utils/Logger";
import type { Collection, Database } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_Collections extends TableSubmodule<"Collections"> {
	constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "Collections");
	}

	public async GetById(id: number): Promise<Collection | null> {
		try {
			return (await this.db.selectFrom("Collections").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			dbLogger.error(`Collections.GetById failed: ${error}`);
			return null;
		}
	}
}
