// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import { Kysely_Token } from "@core/interfaces/DependencyInjectionTokens";
import { Log_Error } from "@utils/Logger";
import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import type { Chapter, Database } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_Chapters extends TableSubmodule<"Chapters"> {
	constructor(@inject(Kysely_Token) db: Kysely<Database>) {
		super(db, "Chapters");
	}

	public async GetBySid(sid: string): Promise<Chapter | null> {
		try {
			return (await this.db.selectFrom("Chapters").selectAll().where("sid", "=", sid).executeTakeFirst()) ?? null;
		} catch (error) {
			Log_Error(`Chapters.GetBySid failed: ${error}`);
			return null;
		}
	}
}
