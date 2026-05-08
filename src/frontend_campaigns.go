package src

import "fmt"

type Campaign struct {
	Id             int     `db:"id" json:"id"`
	SaveDataId     int     `db:"save_data_id" json:"saveDataId"`
	CampaignNameId string  `db:"campaign_name_id" json:"campaignNameId"`
	LobbyId        *int    `db:"lobby_id" json:"lobbyId"`
	CoverImgPath   *string `db:"cover_img_path" json:"coverImgPath"`
}

type Lobby struct {
	Id             int     `db:"id" json:"id"`
	SaveDataId     int     `db:"save_data_id" json:"saveDataId"`
	Name           string  `db:"name" json:"name"`
	ChapterSid     *string `db:"chapter_sid" json:"chapterSid"`
	IconImgPath    *string `db:"icon_img_path" json:"iconImgPath"`
}

// Campaign CRUD

func Campaign_Insert(saveDataId int, nameId string, lobbyId *int, coverPath *string) (int64, error) {
	res, err := Db_Exec(`INSERT INTO Campaigns (save_data_id, campaign_name_id, lobby_id, cover_img_path) VALUES (?, ?, ?, ?)`, 
		saveDataId, nameId, lobbyId, coverPath)

	if err != nil {
		LogError(fmt.Sprintf("[Campaign Insert] Error: %s", err))
		return 0, err
	}

	return res.LastIdInserted, nil
}

func Campaign_Update(id int, nameId string, lobbyId *int, coverPath *string) error {
	_, err := Db_Exec(`UPDATE Campaigns SET campaign_name_id = ?, lobby_id = ?, cover_img_path = ? WHERE id = ?`, 
		nameId, lobbyId, coverPath, id)

	if err != nil {
		LogError(fmt.Sprintf("[Campaign Update] Error: %s", err))
		return err
	}

	return nil
}

func Campaign_Delete(id int) error {
	_, err := Db_Exec(`DELETE FROM Campaigns WHERE id = ?`, id)

	if err != nil {
		LogError(fmt.Sprintf("[Campaign Delete] Error: %s", err))
		return err
	}

	return nil
}

func Campaign_Get(id int) (Campaign, error) {
	var results []Campaign
	err := Db_Select(&results, `SELECT id, save_data_id, campaign_name_id, lobby_id, cover_img_path FROM Campaigns WHERE id = ? LIMIT 1`, id)

	if err != nil {
		return Campaign{}, err
	}

	if len(results) == 0 {
		return Campaign{}, fmt.Errorf("campaign not found")
	}

	return results[0], nil
}

func Campaign_ListBySaveData(saveDataId int) ([]Campaign, error) {
	results := make([]Campaign, 0)
	err := Db_Select(&results, `SELECT id, save_data_id, campaign_name_id, lobby_id, cover_img_path FROM Campaigns WHERE save_data_id = ?`, saveDataId)

	if err != nil {
		return nil, err
	}

	return results, nil
}

// Lobby CRUD

func Lobby_Insert(saveDataId int, name string, chapterSid *string, iconPath *string) (int64, error) {
	res, err := Db_Exec(`INSERT INTO Lobbies (save_data_id, name, chapter_sid, icon_img_path) VALUES (?, ?, ?, ?)`, 
		saveDataId, name, chapterSid, iconPath)

	if err != nil {
		LogError(fmt.Sprintf("[Lobby Insert] Error: %s", err))
		return 0, err
	}

	return res.LastIdInserted, nil
}

func Lobby_ListBySaveData(saveDataId int) ([]Lobby, error) {
	results := make([]Lobby, 0)
	err := Db_Select(&results, `SELECT id, save_data_id, name, chapter_sid, icon_img_path FROM Lobbies WHERE save_data_id = ?`, saveDataId)

	if err != nil {
		return nil, err
	}

	return results, nil
}
