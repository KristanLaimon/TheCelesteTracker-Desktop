// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import { CTDB_Token } from "@core/interfaces/DependencyInjectionTokens";
import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import type { Database } from "./db.types";
import _submodule_service_Campaigns from "./submodules/campaigns";
import _submodule_service_ChapterSideRooms from "./submodules/chapterSideRooms";
import _submodule_service_ChapterSides from "./submodules/chapterSides";
import _submodule_service_ChapterSideTypes from "./submodules/chapterSideTypes";
import _submodule_service_Chapters from "./submodules/chapters";
import _submodule_service_CollectionCampaigns from "./submodules/collectionCampaigns";
import _submodule_service_Collections from "./submodules/collections";
import _submodule_service_GameSessionChapterRoomStats from "./submodules/gameSessionChapterRoomStats";
import _submodule_service_GameSessions from "./submodules/gameSessions";
import _submodule_service_Lobbies from "./submodules/lobbies";
import _submodule_service_SaveDatas from "./submodules/saveDatas";
import _submodule_service_Users from "./submodules/users";

/**
 * Facade over the tracker DB: one submodule per table, plus `Query` for anything spanning tables.
 * Every statement runs in its own Go CLI process, so transactions are not available.
 */
@injectable()
export default class CTDB {
	constructor(
		public Users: _submodule_service_Users,
		public ChapterSideTypes: _submodule_service_ChapterSideTypes,
		public SaveDatas: _submodule_service_SaveDatas,
		public Campaigns: _submodule_service_Campaigns,
		public Chapters: _submodule_service_Chapters,
		public ChapterSides: _submodule_service_ChapterSides,
		public ChapterSideRooms: _submodule_service_ChapterSideRooms,
		public GameSessions: _submodule_service_GameSessions,
		public GameSessionChapterRoomStats: _submodule_service_GameSessionChapterRoomStats,
		public Lobbies: _submodule_service_Lobbies,
		public Collections: _submodule_service_Collections,
		public CollectionCampaigns: _submodule_service_CollectionCampaigns,
		@inject(CTDB_Token) public Query: Kysely<Database>,
	) {}
}
