// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import { CTDB_Token } from "../../core/interfaces/DependencyInjectionTokens";
import { dbLogger } from "../../utils/Logger";
import type { ChapterSide, Database } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_ChapterSides extends TableSubmodule<"ChapterSides"> {
	constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "ChapterSides");
	}

	public async GetByPk(opts: { chapterSid: string; sideId: string }): Promise<ChapterSide | null> {
		try {
			return (
				(await this.db
					.selectFrom("ChapterSides")
					.selectAll()
					.where("chapter_sid", "=", opts.chapterSid)
					.where("side_id", "=", opts.sideId)
					.executeTakeFirst()) ?? null
			);
		} catch (error) {
			dbLogger.error(`ChapterSides.GetByPk failed: ${error}`);
			return null;
		}
	}
}
