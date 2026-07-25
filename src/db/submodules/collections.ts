// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import { Kysely_Token } from "@core/interfaces/DependencyInjectionTokens";
import { Log_Error } from "@utils/Logger";
import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import type { Collection, Database } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_Collections extends TableSubmodule<"Collections"> {
	constructor(@inject(Kysely_Token) db: Kysely<Database>) {
		super(db, "Collections");
	}

	public async GetById(id: number): Promise<Collection | null> {
		try {
			return (await this.db.selectFrom("Collections").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			Log_Error(`Collections.GetById failed: ${error}`);
			return null;
		}
	}
}
