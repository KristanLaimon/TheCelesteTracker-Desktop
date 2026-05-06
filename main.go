package main

import (
	"TheCelesteTrackerDesktop/src"
	"embed"
	"encoding/json"
	"fmt"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	var isDev bool = false;

	if isDev {
		res, err := src.Query_GetRecentRunHistory(1,1,2,1)
		if err != nil {
			log.Fatalf("%s", err.Error())
		}
		Debug(res)
	}

	if !isDev {
		StartWailsApp()
	}
}

func StartWailsApp() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "TheCelesteTrackerDesktop",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []any{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}


func Debug(anything any) {
	bytes, err := json.Marshal(anything)
	if err != nil {
		log.Fatalf("%s", err.Error())
	}
	fmt.Println(string(bytes))
}
