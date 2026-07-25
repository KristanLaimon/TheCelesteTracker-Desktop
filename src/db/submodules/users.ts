// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import { CTDB_Token } from "../../core/interfaces/DependencyInjectionTokens";
import { Log_Error } from "../../utils/Logger";
import type { Database, User } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_Users extends TableSubmodule<"Users"> {
	constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "Users");
	}

	public async GetById(id: number): Promise<User | null> {
		try {
			return (await this.db.selectFrom("Users").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			Log_Error(`Users.GetById failed: ${error}`);
			return null;
		}
	}
}
