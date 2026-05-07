package src

import "fmt"

type AppConfig struct {
	DatabaseAlreadyAppended bool `json:"DatabaseAlreadyAppended"`
}

var config_file_path = "./config.json"

var CONFIG AppConfig = AppConfig{
	DatabaseAlreadyAppended: false,
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
}
