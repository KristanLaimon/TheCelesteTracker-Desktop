package main

import (
	"TheCelesteTrackerDesktop/src"
	"context"
	"fmt"
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
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// ================= HERE STARTS OUR METHODS =========================
func (a *App) Query_GetRecentHistory(saveDataId int, userId int, pageSize int, currentPage int) []src.RecentRun {
	toReturn ,err := src.Query_GetRecentRunHistory(saveDataId, userId, pageSize, currentPage)
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
