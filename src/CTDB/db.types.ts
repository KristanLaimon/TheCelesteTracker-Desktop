// UNIVERSAL COMPATIBILITY
export type User = {
	id: number;
	name: string;
};

export type ChapterSideType = {
	id: string;
};

export type SaveData = {
	id: number;
	user_id: number;
	slot_number: number;
	file_name: string;
};

export type Campaign = {
	id: number;
	save_data_id: number;
	campaign_name_id: string;
};

export type Chapter = {
	sid: string;
	campaign_id: number;
	// 'name' does not have a NOT NULL constraint, so it can be null
	name: string | null;
};

export type ChapterSide = {
	chapter_sid: string;
	side_id: string;
	berries_available: number;
	berries_collected: number;
	heart_collected: number; // 0 or 1
	goldenstrawberry_achieved: number; // 0 or 1
	goldenwingstrawberry_achieved: number; // 0 or 1
};

export type ChapterSideRoom = {
	chapter_sid: string;
	side_id: string;
	name: string;
	order: number;
	strawberries_available: number;
};

export type GameSession = {
	id: string;
	chapter_sid: string;
	side_id: string;
	date_time_start: string; // Stored as TEXT (e.g., ISO 8601 string)
	duration_ms: number;
	is_goldenberry_attempt: number; // 0 or 1
	is_goldenberry_completed: number; // 0 or 1
};

export type GameSessionChapterRoomStat = {
	id: number;
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
