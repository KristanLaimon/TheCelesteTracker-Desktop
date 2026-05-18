package src

import "fmt"

type AppConfig struct {
	DatabaseAlreadyAppended                bool            `json:"DatabaseAlreadyAppended"`
	InitialProgressScrappingMade           bool            `json:"initial_progress_scrapping_made"`
	InitialProgressScrappingMadeBySlotFile map[string]bool `json:"initial_progress_scrapping_made_by_slotfile"`
	SelectedSaveSlotFile                   int             `json:"selected_save_slotfile"`
}

var config_file_path = "./config.json"

var CONFIG AppConfig = AppConfig{
	DatabaseAlreadyAppended:                false,
	InitialProgressScrappingMade:           false,
	InitialProgressScrappingMadeBySlotFile: make(map[string]bool),
	SelectedSaveSlotFile:                   0,
}

func Config_Initialize() {
	LogInfo("Initializing configuration...")
	if !FileExists(config_file_path) {
		LogInfo("Config file not found, creating default...")
		err := WriteToFileAsJson(config_file_path, CONFIG)
		if err != nil {
			LogError(fmt.Sprintf("Error creating config file: %s", err))
		}
	} else {
		LogInfo("Loading existing config file...")
		err := ReadFileToObject(config_file_path, &CONFIG)
		if err != nil {
			LogError(fmt.Sprintf("Error reading config file: %s", err))
		}
	}
	if CONFIG.InitialProgressScrappingMadeBySlotFile == nil {
		CONFIG.InitialProgressScrappingMadeBySlotFile = make(map[string]bool)
	}
}

func Config_IsInitialProgressScrappingMadeForConfiguredSlot() bool {
	slotKey := fmt.Sprintf("%d", CONFIG.SelectedSaveSlotFile)
	return CONFIG.InitialProgressScrappingMadeBySlotFile[slotKey]
}

func Config_MarkInitialProgressScrappingMadeForConfiguredSlot() error {
	if CONFIG.InitialProgressScrappingMadeBySlotFile == nil {
		CONFIG.InitialProgressScrappingMadeBySlotFile = make(map[string]bool)
	}
	slotKey := fmt.Sprintf("%d", CONFIG.SelectedSaveSlotFile)
	CONFIG.InitialProgressScrappingMadeBySlotFile[slotKey] = true
	CONFIG.InitialProgressScrappingMade = true
	return WriteToFileAsJson(config_file_path, CONFIG)
}
