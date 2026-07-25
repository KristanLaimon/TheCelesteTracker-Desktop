// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import { CTDB_Token } from "@core/interfaces/DependencyInjectionTokens";
import { Log_Error } from "@utils/Logger";
import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import type { Database, GameSessionChapterRoomStat } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_GameSessionChapterRoomStats extends TableSubmodule<"GameSessionChapterRoomStats"> {
	constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "GameSessionChapterRoomStats");
	}

	public async GetById(id: number): Promise<GameSessionChapterRoomStat | null> {
		try {
			return (await this.db.selectFrom("GameSessionChapterRoomStats").selectAll().where("id", "=", id).executeTakeFirst()) ?? null;
		} catch (error) {
			Log_Error(`GameSessionChapterRoomStats.GetById failed: ${error}`);
			return null;
		}
	}

	public async GetByGameSession(gameSessionId: string): Promise<GameSessionChapterRoomStat[]> {
		try {
			return await this.db.selectFrom("GameSessionChapterRoomStats").selectAll().where("gamesession_id", "=", gameSessionId).execute();
		} catch (error) {
			Log_Error(`GameSessionChapterRoomStats.GetByGameSession failed: ${error}`);
			return [];
		}
	}
}
