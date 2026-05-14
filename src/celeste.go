package src

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

type CelesteInstallValidation struct {
	CelesteInstalled bool   `json:"celesteInstalled"`
	EverestInstalled bool   `json:"everestInstalled"`
	CelestePath      string `json:"celestePath"`
	ModsPath         string `json:"modsPath"`
	Message          string `json:"message"`
}

func ValidateCelesteInstall() CelesteInstallValidation {
	celestePath, err := GetCelesteFolderPath()
	if err != nil {
		return CelesteInstallValidation{
			CelesteInstalled: false,
			EverestInstalled: false,
			Message:          err.Error(),
		}
	}

	modsPath := filepath.Join(celestePath, "Mods")
	return CelesteInstallValidation{
		CelesteInstalled: true,
		EverestInstalled: isEverestInstalled(celestePath),
		CelestePath:      celestePath,
		ModsPath:         modsPath,
		Message:          "Celeste installation found.",
	}
}

// GetCelesteFolderPath attempts to find the Celeste installation folder.
// Returns the absolute path and nil, or an empty string and an error if not found.
func GetCelesteFolderPath() (string, error) {
	for _, steamRoot := range getSteamLibraryRoots() {
		candidate := filepath.Join(steamRoot, "steamapps", "common", "Celeste")
		if isCelesteDir(candidate) {
			return candidate, nil
		}
	}

	return "", fmt.Errorf("Celeste installation folder not found in Steam libraries")
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

func isCelesteDir(path string) bool {
	if !isDir(path) {
		return false
	}
	for _, executable := range celesteExecutableNames() {
		if FileExists(filepath.Join(path, executable)) {
			return true
		}
	}
	return isDir(filepath.Join(path, "Content")) || isDir(filepath.Join(path, "Mods"))
}

func celesteExecutableNames() []string {
	switch runtime.GOOS {
	case "windows":
		return []string{"Celeste.exe"}
	case "darwin":
		return []string{"Celeste.app", "Celeste"}
	default:
		return []string{"Celeste", "Celeste.bin.x86_64", "Celeste.bin.x86"}
	}
}

func isEverestInstalled(celestePath string) bool {
	candidates := []string{
		filepath.Join(celestePath, "Everest.dll"),
		filepath.Join(celestePath, "Celeste.Mod.mm.dll"),
		filepath.Join(celestePath, "MiniInstaller.exe"),
		filepath.Join(celestePath, "Mods", "Everest"),
		filepath.Join(celestePath, "Mods", "Everest.zip"),
	}
	for _, candidate := range candidates {
		if FileExists(candidate) || isDir(candidate) {
			return true
		}
	}
	return false
}

func getSteamLibraryRoots() []string {
	roots := make([]string, 0)
	seen := make(map[string]bool)
	add := func(path string) {
		if path == "" {
			return
		}
		cleaned, err := filepath.Abs(os.ExpandEnv(path))
		if err != nil {
			cleaned = filepath.Clean(os.ExpandEnv(path))
		}
		key := strings.ToLower(cleaned)
		if !seen[key] {
			seen[key] = true
			roots = append(roots, cleaned)
		}
	}

	for _, root := range getDefaultSteamRoots() {
		add(root)
		for _, library := range readSteamLibraryFolders(root) {
			add(library)
		}
	}

	return roots
}

func getDefaultSteamRoots() []string {
	home, _ := os.UserHomeDir()
	roots := make([]string, 0)
	switch runtime.GOOS {
	case "windows":
		for _, envName := range []string{"ProgramFiles(x86)", "ProgramFiles"} {
			if base := os.Getenv(envName); base != "" {
				roots = append(roots, filepath.Join(base, "Steam"))
			}
		}
		for drive := 'A'; drive <= 'Z'; drive++ {
			roots = append(roots, fmt.Sprintf("%c:\\SteamLibrary", drive))
			roots = append(roots, fmt.Sprintf("%c:\\Steam", drive))
		}
	case "darwin":
		if home != "" {
			roots = append(roots, filepath.Join(home, "Library", "Application Support", "Steam"))
		}
	default:
		if home != "" {
			roots = append(roots,
				filepath.Join(home, ".local", "share", "Steam"),
				filepath.Join(home, ".steam", "steam"),
				filepath.Join(home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam"),
			)
		}
	}
	return roots
}

func readSteamLibraryFolders(steamRoot string) []string {
	content, err := os.ReadFile(filepath.Join(steamRoot, "steamapps", "libraryfolders.vdf"))
	if err != nil {
		return []string{}
	}

	paths := make([]string, 0)
	for _, line := range strings.Split(string(content), "\n") {
		fields := quotedVDFFields(line)
		if len(fields) >= 2 && strings.EqualFold(fields[0], "path") {
			paths = append(paths, fields[1])
		}
	}
	return paths
}

func quotedVDFFields(line string) []string {
	fields := make([]string, 0)
	inQuote := false
	escaped := false
	var current strings.Builder

	for _, char := range line {
		if escaped {
			current.WriteRune(char)
			escaped = false
			continue
		}
		if char == '\\' && inQuote {
			escaped = true
			continue
		}
		if char == '"' {
			if inQuote {
				fields = append(fields, current.String())
				current.Reset()
			}
			inQuote = !inQuote
			continue
		}
		if inQuote {
			current.WriteRune(char)
		}
	}
	return fields
}
