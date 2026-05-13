package src

import "fmt"

type CampaignItem struct {
	Id             int    `db:"id" json:"id"`
	CampaignNameId string `db:"campaign_name_id" json:"campaignNameId"`
	CoverImgPath   string `db:"cover_img_path" json:"coverImgPath"`
}

type LevelCollectionStats struct {
	CampaignId         int     `db:"campaign_id" json:"campaignId"`
	CampaignName       string  `db:"campaign_name" json:"campaignName"`
	LobbyId            *int    `db:"lobby_id" json:"lobbyId"`
	LobbyName          *string `db:"lobby_name" json:"lobbyName"`
	LevelName          string  `db:"level_name" json:"levelName"`
	ChapterName        string  `db:"chapter_name" json:"chapterName"`
	LevelSide          string  `db:"level_side" json:"levelSide"`
	TotalTime          int64   `db:"total_time" json:"totalTime"`
	Strawberries       int     `db:"strawberries" json:"strawberries"`
	MaxStrawberries    int     `db:"max_strawberries" json:"maxStrawberries"`
	GoldenStrawberries int     `db:"golden_strawberries" json:"goldenStrawberries"`
	Hearts             int     `db:"hearts" json:"hearts"`
	MaxHearts          int     `db:"max_hearts" json:"maxHearts"`
	Deaths             int     `db:"deaths" json:"deaths"`
	FewestDeaths       int     `db:"fewest_deaths" json:"fewestDeaths"`
	Dashes             int     `db:"dashes" json:"dashes"`
	Jumps              int     `db:"jumps" json:"jumps"`
	CoverImgPath       *string `db:"cover_img_path" json:"coverImgPath"`
	IconImgPath        *string `db:"icon_img_path" json:"iconImgPath"`
	EndscreenImgPath   *string `db:"endscreen_img_path" json:"endscreenImgPath"`
}

func Collection_AddCampaign(collectionId int, campaignId int) bool {
	_, err := Db_Exec(`INSERT INTO CollectionCampaigns (collection_id, campaign_id) VALUES (?, ?)`, collectionId, campaignId)

	if err != nil {
		LogError(err.Error())
		return false
	}

	return true
}

func Collection_RemoveCampaign(collectionId int, campaignId int) bool {
	_, err := Db_Exec(`DELETE FROM CollectionCampaigns WHERE collection_id = ? AND campaign_id = ?`, collectionId, campaignId)

	if err != nil {
		LogError(err.Error())
		return false
	}

	return true
}

func Collection_GetCampaignIDs(collectionId int) ([]int, error) {
	var results []struct {
		CampaignID int `db:"campaign_id"`
	}
	err := Db_Select(&results, `SELECT campaign_id FROM CollectionCampaigns WHERE collection_id = ?`, collectionId)

	if err != nil {
		return nil, err
	}

	ids := make([]int, len(results))
	for i, r := range results {
		ids[i] = r.CampaignID
	}
	return ids, nil
}

func Query_GetAvailableCampaigns(userId int) ([]CampaignItem, error) {
	toReturn := make([]CampaignItem, 0)

	query := `
		SELECT 
			MIN(c.id) as id, 
			c.campaign_name_id, 
			COALESCE(c.cover_img_path, '') as cover_img_path 
		FROM Campaigns c
		JOIN SaveDatas sd ON c.save_data_id = sd.id
		WHERE sd.user_id = ?
		GROUP BY c.campaign_name_id
	`

	err := Db_Select(&toReturn, query, userId)

	if err != nil {
		LogError(fmt.Sprintf("[Query_GetAvailableCampaigns] Error: %s", err))
		return make([]CampaignItem, 0), err
	}

	return toReturn, nil
}

func Query_GetCollectionStats(campaignIds []int, saveDataId *int) ([]LevelCollectionStats, error) {
	if len(campaignIds) == 0 {
		return []LevelCollectionStats{}, nil
	}

	query := `
		SELECT 
			c.id as campaign_id,
			c.campaign_name_id as campaign_name,
			l.id as lobby_id,
			l.name as lobby_name,
			ch.sid as level_name,
			COALESCE(NULLIF(ch.name, ''), ch.sid) as chapter_name,
			cs.side_id as level_side,
			COALESCE(play_stats.total_time, 0) as total_time,
			COALESCE(cs.berries_collected, 0) as strawberries,
			COALESCE(cs.berries_available, 0) as max_strawberries,
			COALESCE(cs.goldenstrawberry_achieved, 0) as golden_strawberries,
			COALESCE(cs.heart_collected, 0) as hearts,
			1 as max_hearts,
			COALESCE(play_stats.deaths, 0) as deaths,
			COALESCE(play_stats.fewest_deaths, 0) as fewest_deaths,
			COALESCE(play_stats.dashes, 0) as dashes,
			COALESCE(play_stats.jumps, 0) as jumps,
			c.cover_img_path,
			ch.icon_img_path,
			ch.endscreen_img_path
		FROM Campaigns c
		LEFT JOIN Lobbies l ON c.lobby_id = l.id
		JOIN Chapters ch ON ch.campaign_id = c.id
		JOIN ChapterSides cs ON cs.chapter_sid = ch.sid
		LEFT JOIN (
			SELECT
				gs.chapter_sid,
				gs.side_id,
				SUM(gs.duration_ms) as total_time,
				SUM(COALESCE(session_totals.deaths, 0)) as deaths,
				MIN(COALESCE(session_totals.deaths, 0)) as fewest_deaths,
				SUM(COALESCE(session_totals.dashes, 0)) as dashes,
				SUM(COALESCE(session_totals.jumps, 0)) as jumps
			FROM GameSessions gs
			LEFT JOIN (
				SELECT
					gamesession_id,
					SUM(deaths_in_room) as deaths,
					SUM(dashes_in_room) as dashes,
					SUM(jumps_in_room) as jumps
				FROM GameSessionChapterRoomStats
				GROUP BY gamesession_id
			) session_totals ON session_totals.gamesession_id = gs.id
			GROUP BY gs.chapter_sid, gs.side_id
		) play_stats ON play_stats.chapter_sid = ch.sid AND play_stats.side_id = cs.side_id
		WHERE c.id IN (%s)%s
		GROUP BY c.id, ch.sid, cs.side_id
		ORDER BY COALESCE(l.name, ''), c.campaign_name_id, ch.sid, cs.side_id
	`

	// Build the IN clause
	idsStr := ""
	for i, id := range campaignIds {
		if i > 0 {
			idsStr += ","
		}
		idsStr += fmt.Sprintf("%d", id)
	}

	saveDataFilter := ""
	if saveDataId != nil {
		saveDataFilter = fmt.Sprintf(" AND c.save_data_id = %d", *saveDataId)
	}

	query = fmt.Sprintf(query, idsStr, saveDataFilter)

	toReturn := make([]LevelCollectionStats, 0)
	err := Db_Select(&toReturn, query)
	if err != nil {
		return nil, err
	}

	return toReturn, nil
}
