// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import { CTDB_Token } from "../../core/interfaces/DependencyInjectionTokens";
import { dbLogger } from "../../utils/Logger";
import type { ChapterSideType, Database } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class Submodule_ChapterSideTypes extends TableSubmodule<"ChapterSideTypes"> {
	public constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "ChapterSideTypes");
	}

	public async GetById(id: string): Promise<ChapterSideType | null> {
		try {
			return (await this.db.selectFrom("ChapterSideTypes").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			dbLogger.error(`ChapterSideTypes.GetById failed: ${error}`);
			return null;
		}
	}
}
