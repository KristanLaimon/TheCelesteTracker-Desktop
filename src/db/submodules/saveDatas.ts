// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import { CTDB_Token } from "../../core/interfaces/DependencyInjectionTokens";
import { Log_Error } from "../../utils/Logger";
import type { Database, SaveData } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_SaveDatas extends TableSubmodule<"SaveDatas"> {
	constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "SaveDatas");
	}

	public async GetById(id: number): Promise<SaveData | null> {
		try {
			return (await this.db.selectFrom("SaveDatas").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			Log_Error(`SaveDatas.GetById failed: ${error}`);
			return null;
		}
	}
}
