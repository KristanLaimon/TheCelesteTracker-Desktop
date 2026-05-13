package main

import (
	"TheCelesteTrackerDesktop/src"
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	src.LogInfo("Application starting up...")
	src.Config_Initialize()

	if !src.CONFIG.DatabaseAlreadyAppended {
		src.LogInfo("Appending Desktop schema to database...")
		err := src.Db_AppendDesktopSchema()
		if err != nil {
			src.LogError(fmt.Sprintf("Failed to append desktop schema: %s", err))
		} else {
			src.CONFIG.DatabaseAlreadyAppended = true
			src.WriteToFileAsJson("./config.json", src.CONFIG)
			src.LogInfo("Desktop schema appended successfully.")
		}
	} else {
		src.LogInfo("Desktop schema database already appended. Skipping...")
	}

	result, err := src.Asset_IndexInstalledMods()
	if err != nil {
		src.LogError(fmt.Sprintf("Failed to index mod assets: %s", err))
	} else {
		src.LogInfo(fmt.Sprintf("Mod assets indexed: %+v", result))
	}
}

func (a *App) QuitApp() {
	runtime.Quit(a.ctx)
}

func (a *App) MaximiseApp() {
	runtime.WindowMaximise(a.ctx)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// ================= HERE STARTS OUR METHODS =========================
func (a *App) Query_GetRecentHistory(saveDataId int, userId int, pageSize int, currentPage int) []src.RecentRun {
	toReturn, err := src.Query_GetRecentRunHistory(saveDataId, userId, pageSize, currentPage)
	if err != nil {
		return make([]src.RecentRun, 0)
	}
	return toReturn
}

func (a *App) Query_GetGlobalStats(saveDataId int, userId int) ([]src.GlobalStats, error) {
	toReturn, err := src.Query_GetGlobalStats(saveDataId, userId)
	if err != nil {
		return make([]src.GlobalStats, 0), err
	}
	return toReturn, nil
}

// Collections CRUD
func (a *App) GetCollections(userId int) ([]src.Collection, error) {
	return src.Collection_List(userId)
}

func (a *App) GetCollection(collectionId int) (src.Collection, error) {
	return src.Collection_Get(collectionId)
}

func (a *App) CreateCollection(userId int, name string, campaignIds []int) (int, error) {
	id, err := src.Collection_Insert(userId, name)
	if err != nil {
		return 0, err
	}

	for _, campId := range campaignIds {
		src.Collection_AddCampaign(int(id), campId)
	}

	return int(id), nil
}

func (a *App) UpdateCollection(collectionId int, name string, campaignIds []int) error {
	err := src.Collection_Update(collectionId, name)
	if err != nil {
		return err
	}

	// Simple way: delete all and re-add (can be optimized)
	_, _ = src.Db_Exec(`DELETE FROM CollectionCampaigns WHERE collection_id = ?`, collectionId)
	for _, campId := range campaignIds {
		src.Collection_AddCampaign(collectionId, campId)
	}

	return nil
}

func (a *App) DeleteCollection(collectionId int) error {
	return src.Collection_Delete(collectionId)
}

func (a *App) GetAvailableCampaigns(userId int) ([]src.CampaignItem, error) {
	return src.Query_GetAvailableCampaigns(userId)
}

func (a *App) GetCollectionCampaignIDs(collectionId int) ([]int, error) {
	return src.Collection_GetCampaignIDs(collectionId)
}

func (a *App) GetCollectionStats(campaignIds []int, saveDataId *int) ([]src.LevelCollectionStats, error) {
	return src.Query_GetCollectionStats(campaignIds, saveDataId)
}

func (a *App) GetAssetAsBase64(path string) (string, error) {
	return src.GetAssetAsBase64(path)
}

func (a *App) GetIndexedAssetAsBase64(fileName string) (string, error) {
	return src.GetIndexedAssetAsBase64(fileName)
}

func (a *App) IndexModAssets() (src.ModAssetIndexResult, error) {
	return src.Asset_IndexInstalledMods()
}

// Campaign CRUD
func (a *App) CreateCampaign(saveDataId int, nameId string, lobbyId *int, coverPath *string) (int, error) {
	id, err := src.Campaign_Insert(saveDataId, nameId, lobbyId, coverPath)
	return int(id), err
}

func (a *App) UpdateCampaign(id int, nameId string, lobbyId *int, coverPath *string) error {
	return src.Campaign_Update(id, nameId, lobbyId, coverPath)
}

func (a *App) DeleteCampaign(id int) error {
	return src.Campaign_Delete(id)
}

func (a *App) GetCampaign(id int) (src.Campaign, error) {
	return src.Campaign_Get(id)
}

func (a *App) GetCampaigns(saveDataId int) ([]src.Campaign, error) {
	return src.Campaign_ListBySaveData(saveDataId)
}

// Lobby CRUD
func (a *App) CreateLobby(saveDataId int, name string, chapterSid *string, iconPath *string) (int, error) {
	id, err := src.Lobby_Insert(saveDataId, name, chapterSid, iconPath)
	return int(id), err
}

func (a *App) GetLobbies(saveDataId int) ([]src.Lobby, error) {
	return src.Lobby_ListBySaveData(saveDataId)
}
