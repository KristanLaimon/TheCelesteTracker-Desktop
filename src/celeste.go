package src

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

// GetCelesteFolderPath attempts to find the Celeste installation folder.
// Returns the absolute path and nil, or an empty string and an error if not found.
func GetCelesteFolderPath() (string, error) {
	var pathsToTry []string
	home, _ := os.UserHomeDir()

	// Define the common Steam sub-path
	celesteSubDir := filepath.Join("steamapps", "common", "Celeste")

	switch runtime.GOOS {
	case "windows":
		// Check common Program Files locations
		pf86 := os.Getenv("ProgramFiles(x86)")
		pf := os.Getenv("ProgramFiles")
		if pf86 != "" {
			pathsToTry = append(pathsToTry, filepath.Join(pf86, "Steam", celesteSubDir))
		}
		if pf != "" {
			pathsToTry = append(pathsToTry, filepath.Join(pf, "Steam", celesteSubDir))
		}

	case "darwin": // macOS
		if home != "" {
			pathsToTry = append(pathsToTry, filepath.Join(home, "Library", "Application Support", "Steam", celesteSubDir))
		}

	case "linux":
		if home != "" {
			pathsToTry = append(pathsToTry,
				filepath.Join(home, ".local", "share", "Steam", celesteSubDir),
				filepath.Join(home, ".steam", "steam", celesteSubDir),
			)
		}
	}

	// Iterate through potential paths and return the first one that exists
	for _, path := range pathsToTry {
		if isDir(path) {
			return path, nil
		}
	}

	return "", fmt.Errorf("Celeste installation folder not found in default Steam locations (Not installed through steam?)")
}

// GetCelesteModsFolder returns the path to the Celeste Mods folder.
func GetCelesteModsFolder() (string, error) {
	celestePath, err := GetCelesteFolderPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(celestePath, "Mods"), nil
}

// GetCelesteSavesFolder returns the path to the Celeste Saves folder.
func GetCelesteSavesFolder() (string, error) {
	celestePath, err := GetCelesteFolderPath()
	if err != nil {
		return "", err
	}
	return filepath.Join(celestePath, "Saves"), nil
}

// GetCelesteModTrackerDatabasePath returns the path to the Celeste Mod Tracker database file.
func GetCelesteModTrackerDatabasePath() (string, error) {
	savesPath, err := GetCelesteSavesFolder()
	if err != nil {
		return "", err
	}
	return filepath.Join(savesPath, "TheCelesteTracker_DB.db"), nil
}

// isDir checks if a path exists and is a directory
func isDir(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}
