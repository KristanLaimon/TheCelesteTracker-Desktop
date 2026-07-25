// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import { Kysely_Token } from "@core/interfaces/DependencyInjectionTokens";
import { Log_Error } from "@utils/Logger";
import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import type { ChapterSideRoom, Database } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_ChapterSideRooms extends TableSubmodule<"ChapterSideRooms"> {
	constructor(@inject(Kysely_Token) db: Kysely<Database>) {
		super(db, "ChapterSideRooms");
	}

	public async GetByPk(opts: { chapterSid: string; sideId: string; name: string }): Promise<ChapterSideRoom | null> {
		try {
			return (
				(await this.db
					.selectFrom("ChapterSideRooms")
					.selectAll()
					.where("chapter_sid", "=", opts.chapterSid)
					.where("side_id", "=", opts.sideId)
					.where("name", "=", opts.name)
					.executeTakeFirst()) ?? null
			);
		} catch (error) {
			Log_Error(`ChapterSideRooms.GetByPk failed: ${error}`);
			return null;
		}
	}
}
