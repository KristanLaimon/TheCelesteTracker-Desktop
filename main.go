package main

import (
	"TheCelesteTrackerDesktop/src"
	"embed"
	"encoding/json"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
  src.LogClearFile()
  StartWailsApp()
}

func StartWailsApp() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "TheCelesteTrackerDesktop",
		Width:  1350,
		Height: 680,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []any{
			app,
		},
	 Frameless: true,
	 Debug: options.Debug{
		  OpenInspectorOnStartup: true,
	 },
	})
	if err != nil {
		src.LogError("Error: " + err.Error())
	}
}

func Debug(anything any) {
	bytes, err := json.Marshal(anything)
	if err != nil {
		src.LogFatalError(err.Error())
	}
	src.LogDebug(string(bytes))
}

