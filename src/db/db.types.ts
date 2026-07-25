// UNIVERSAL COMPATIBILITY

import type { Generated, Insertable, Selectable, Updateable } from "kysely";

/**
 * Kysely table interfaces mirroring the tracker DB schema (`sqlite_master`).
 * `Generated<T>` marks columns SQLite fills in on its own (AUTOINCREMENT ids, DEFAULT values):
 * optional on insert, always present on select.
 */
export type UsersTable = {
	id: Generated<number>;
	name: string;
};

export type ChapterSideTypesTable = {
	id: string; // SIDEA | SIDEB | SIDEC
};

export type SaveDatasTable = {
	id: Generated<number>;
	user_id: number;
	slot_number: number;
	file_name: string;
};

export type CampaignsTable = {
	id: Generated<number>;
	save_data_id: number;
	campaign_name_id: string;
	lobby_id: number | null;
	cover_img_path: string | null;
};

export type ChaptersTable = {
	sid: string; // '{campaignId}:{internalSID}'
	campaign_id: number;
	name: string | null;
	icon_img_path: string | null;
	endscreen_img_path: string | null;
};

export type ChapterSidesTable = {
	chapter_sid: string;
	side_id: string;
	berries_available: number;
	berries_collected: number;
	heart_collected: Generated<number>; // 0 or 1
	goldenstrawberry_achieved: Generated<number>; // 0 or 1
	goldenwingstrawberry_achieved: Generated<number>; // 0 or 1
	hearts_available: number | null;
	desktop_total_time: number | null;
	desktop_deaths: number | null;
	desktop_fewest_deaths: number | null;
	desktop_dashes: number | null;
	desktop_jumps: number | null;
};

export type ChapterSideRoomsTable = {
	chapter_sid: string;
	side_id: string;
	name: string;
	order: number;
	strawberries_available: number;
};

export type GameSessionsTable = {
	id: string;
	chapter_sid: string;
	side_id: string;
	date_time_start: string; // TEXT, ISO 8601
	duration_ms: number;
	is_goldenberry_attempt: number; // 0 or 1
	is_goldenberry_completed: number; // 0 or 1
};

export type GameSessionChapterRoomStatsTable = {
	id: Generated<number>;
	gamesession_id: string;
	chapter_sid: string;
	side_id: string;
	room_name: string;
	deaths_in_room: number;
	dashes_in_room: number;
	strawberries_achieved_in_room: number;
	hearts_achieved_in_room: number;
	jumps_in_room: number;
};

export type LobbiesTable = {
	id: Generated<number>;
	save_data_id: number;
	name: string;
	chapter_sid: string | null;
	icon_img_path: string | null;
};

export type CollectionsTable = {
	id: Generated<number>;
	user_id: number;
	name: string;
};

export type CollectionCampaignsTable = {
	collection_id: number;
	campaign_id: number;
};

/** The schema handed to `Kysely<Database>`: table name -> table interface. */
export type Database = {
	Users: UsersTable;
	ChapterSideTypes: ChapterSideTypesTable;
	SaveDatas: SaveDatasTable;
	Campaigns: CampaignsTable;
	Chapters: ChaptersTable;
	ChapterSides: ChapterSidesTable;
	ChapterSideRooms: ChapterSideRoomsTable;
	GameSessions: GameSessionsTable;
	GameSessionChapterRoomStats: GameSessionChapterRoomStatsTable;
	Lobbies: LobbiesTable;
	Collections: CollectionsTable;
	CollectionCampaigns: CollectionCampaignsTable;
};

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type ChapterSideType = Selectable<ChapterSideTypesTable>;

export type SaveData = Selectable<SaveDatasTable>;
export type NewSaveData = Insertable<SaveDatasTable>;
export type SaveDataUpdate = Updateable<SaveDatasTable>;

export type Campaign = Selectable<CampaignsTable>;
export type NewCampaign = Insertable<CampaignsTable>;
export type CampaignUpdate = Updateable<CampaignsTable>;

export type Chapter = Selectable<ChaptersTable>;
export type NewChapter = Insertable<ChaptersTable>;
export type ChapterUpdate = Updateable<ChaptersTable>;

export type ChapterSide = Selectable<ChapterSidesTable>;
export type NewChapterSide = Insertable<ChapterSidesTable>;
export type ChapterSideUpdate = Updateable<ChapterSidesTable>;

export type ChapterSideRoom = Selectable<ChapterSideRoomsTable>;
export type NewChapterSideRoom = Insertable<ChapterSideRoomsTable>;

export type GameSession = Selectable<GameSessionsTable>;
export type NewGameSession = Insertable<GameSessionsTable>;
export type GameSessionUpdate = Updateable<GameSessionsTable>;

export type GameSessionChapterRoomStat = Selectable<GameSessionChapterRoomStatsTable>;
export type NewGameSessionChapterRoomStat = Insertable<GameSessionChapterRoomStatsTable>;

export type Lobby = Selectable<LobbiesTable>;
export type NewLobby = Insertable<LobbiesTable>;

export type Collection = Selectable<CollectionsTable>;
export type NewCollection = Insertable<CollectionsTable>;

export type CollectionCampaign = Selectable<CollectionCampaignsTable>;
