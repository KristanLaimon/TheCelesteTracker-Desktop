// BROWSER ONLY

import CTDB from "../../../db";
import type { GameSession, GameSessionChapterRoomStat } from "../../../db/db.types";
import { GetLevelSetNamesForMod } from "../../../domain/Everest";
import { GetDependency, DB_Mods as localMods } from "../../../setup";
import { logger } from "../../../utils/Logger";

export type SessionWithTotals = GameSession & {
	deaths: number;
	jumps: number;
	dashes: number;
	strawberries: number;
	chapterName: string;
	roomStatsList: GameSessionChapterRoomStat[];
};

/**
 * Helper to fetch session analytics with room totals from CTDB database for a given mod ID.
 * @param modStringId The target mod identifier string
 */
export async function FetchModSessionsWithTotals(modStringId: string): Promise<SessionWithTotals[]> {
	if (!modStringId || modStringId.trim() === "") return [];

	try {
		const ctdb = GetDependency(CTDB);
		await ctdb.EnsureSchema();

		const everestInfo = await localMods.EverestMods_Get_ModByModId(modStringId);
		const levelSetNames = everestInfo ? GetLevelSetNamesForMod(everestInfo) : [modStringId];
		if (modStringId === "Celeste" || modStringId.toLowerCase() === "celeste") {
			levelSetNames.push("Celeste");
		}

		const sessions = await ctdb.GameSessions.GetSessionsByLevelSet({ levelSetNames, limit: 100 });
		if (sessions.length === 0) return [];

		const sessionIds = sessions.map((s) => s.id);
		const roomStats = await ctdb.GameSessionChapterRoomStats.GetStatsByGameSessionIds({ gameSessionIds: sessionIds });

		const roomStatsBySession = new Map<string, GameSessionChapterRoomStat[]>();
		for (const stat of roomStats) {
			const list = roomStatsBySession.get(stat.gamesession_id);
			if (list) list.push(stat);
			else roomStatsBySession.set(stat.gamesession_id, [stat]);
		}

		return sessions.map((session) => {
			const list = roomStatsBySession.get(session.id) || [];
			let deaths = 0;
			let jumps = 0;
			let dashes = 0;
			let strawberries = 0;

			for (const stat of list) {
				deaths += stat.deaths_in_room;
				jumps += stat.jumps_in_room;
				dashes += stat.dashes_in_room;
				strawberries += stat.strawberries_achieved_in_room;
			}

			return {
				...session,
				deaths,
				jumps,
				dashes,
				strawberries,
				chapterName: session.chapter_sid,
				roomStatsList: list,
			};
		});
	} catch (err: unknown) {
		logger.error("ModAnalytics: Failed to load session analytics from CTDB", err);
		return [];
	}
}
