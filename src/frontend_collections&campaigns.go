package src

func Query_AddCampaignToCollection(userId int, collectionName string, campaignId int) bool {

	foundCollection, err := Collection_Get(userId, collectionName)
	if err != nil {
		LogError(err.Error())
		return false
	}

	res, err := Db_Exec(`INSERT INTO CollectionCampaigns (collection_id, campaign_id) VALUES (%d,%d)`, foundCollection.Id, campaignId)

	if err != nil {
		LogError(err.Error())
		return false
	}

	return res.RowsAffected == 1
}
