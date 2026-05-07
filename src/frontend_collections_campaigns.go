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
	LevelSide          string  `db:"level_side" json:"levelSide"`
	TotalTime          int64   `db:"total_time" json:"totalTime"`
	Strawberries       int     `db:"strawberries" json:"strawberries"`
	GoldenStrawberries int     `db:"golden_strawberries" json:"goldenStrawberries"`
	Hearts             int     `db:"hearts" json:"hearts"`
	Deaths             int     `db:"deaths" json:"deaths"`
	Dashes             int     `db:"dashes" json:"dashes"`
	CoverImgPath       *string `db:"cover_img_path" json:"coverImgPath"`
	IconImgPath        *string `db:"icon_img_path" json:"iconImgPath"`
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
	err := Db_Select(&toReturn, `SELECT id, campaign_name_id, COALESCE(cover_img_path, '') as cover_img_path FROM Campaigns`)

	if err != nil {
		return nil, err
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
			cs.side_id as level_side,
			COALESCE(SUM(gs.duration_ms), 0) as total_time,
			cs.berries_collected as strawberries,
			COALESCE(SUM(gs.is_goldenberry_completed), 0) as golden_strawberries,
			cs.heart_collected as hearts,
			COALESCE(SUM(room_stats.deaths_in_room), 0) as deaths,
			COALESCE(SUM(room_stats.dashes_in_room), 0) as dashes,
			c.cover_img_path,
			ch.icon_img_path
		FROM Campaigns c
		LEFT JOIN Lobbies l ON c.lobby_id = l.id
		JOIN Chapters ch ON ch.campaign_id = c.id
		JOIN ChapterSides cs ON cs.chapter_sid = ch.sid
		LEFT JOIN GameSessions gs ON gs.chapter_sid = ch.sid AND gs.side_id = cs.side_id
		LEFT JOIN GameSessionChapterRoomStats room_stats ON room_stats.game_session_id = gs.id
		WHERE c.id IN (%s)
		GROUP BY c.id, ch.sid, cs.side_id
	`

	// Build the IN clause
	idsStr := ""
	for i, id := range campaignIds {
		if i > 0 {
			idsStr += ","
		}
		idsStr += fmt.Sprintf("%d", id)
	}

	query = fmt.Sprintf(query, idsStr)

	toReturn := make([]LevelCollectionStats, 0)
	err := Db_Select(&toReturn, query)
	if err != nil {
		return nil, err
	}

	return toReturn, nil
}
