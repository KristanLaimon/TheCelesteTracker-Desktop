package src

import (
	"crypto/sha1"
	"database/sql"
	"encoding/hex"
	"encoding/xml"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const initialProgressRoomName = "__initial_save_import__"

type InitialProgressBootstrapResult struct {
	SlotFile          int                 `json:"slotFile"`
	SaveFile          string              `json:"saveFile"`
	ModSaveFile       string              `json:"modSaveFile"`
	DashCountFile     string              `json:"dashCountFile"`
	DashCountFound    bool                `json:"dashCountFound"`
	CampaignsTouched  int                 `json:"campaignsTouched"`
	ChaptersTouched   int                 `json:"chaptersTouched"`
	SidesTouched      int                 `json:"sidesTouched"`
	SessionsInserted  int                 `json:"sessionsInserted"`
	RoomStatsInserted int                 `json:"roomStatsInserted"`
	AssetIndex        ModAssetIndexResult `json:"assetIndex"`
}

type initialProgressEntry struct {
	CampaignName       string
	ChapterSID         string
	SideID             string
	BerriesCollected   int
	BerriesAvailable   int
	HeartCollected     bool
	GoldenCollected    bool
	Deaths             int
	Dashes             int
	Jumps              int
	DurationMs         int64
	Played             bool
	Completed          bool
	SingleRunCompleted bool
	FullClear          bool
}

type initialProgressSaveXML struct {
	Name      string                       `xml:"Name"`
	Areas     []initialProgressAreaXML     `xml:"Areas>AreaStats"`
	LevelSets []initialProgressLevelSetXML `xml:"LevelSets>LevelSetStats"`
}

type initialProgressModSaveXML struct {
	LevelSets []initialProgressLevelSetXML `xml:"LevelSets>LevelSetStats"`
}

type initialProgressLevelSetXML struct {
	Name  string                   `xml:"Name,attr"`
	Areas []initialProgressAreaXML `xml:"Areas>AreaStats"`
}

type initialProgressAreaXML struct {
	SID   string                       `xml:"SID,attr"`
	Modes []initialProgressAreaModeXML `xml:"Modes>AreaModeStats"`
}

type initialProgressAreaModeXML struct {
	TotalStrawberries  int                          `xml:"TotalStrawberries,attr"`
	Completed          bool                         `xml:"Completed,attr"`
	SingleRunCompleted bool                         `xml:"SingleRunCompleted,attr"`
	FullClear          bool                         `xml:"FullClear,attr"`
	Deaths             int                          `xml:"Deaths,attr"`
	TimePlayedTicks    int64                        `xml:"TimePlayed,attr"`
	BestDashes         int                          `xml:"BestDashes,attr"`
	BestDeaths         int                          `xml:"BestDeaths,attr"`
	HeartGem           bool                         `xml:"HeartGem,attr"`
	Strawberries       []initialProgressEntityIDXML `xml:"Strawberries>EntityID"`
}

type initialProgressEntityIDXML struct {
	Key string `xml:"Key,attr"`
}

func InitialProgress_BootstrapConfiguredSlot() (InitialProgressBootstrapResult, error) {
	return InitialProgress_BootstrapSlot(CONFIG.SelectedSaveSlotFile)
}

func InitialProgress_BootstrapSlot(slotFile int) (InitialProgressBootstrapResult, error) {
	if slotFile < 0 {
		return InitialProgressBootstrapResult{}, fmt.Errorf("invalid save slot file: %d", slotFile)
	}

	savesFolder, err := GetCelesteSavesFolder()
	if err != nil {
		return InitialProgressBootstrapResult{}, err
	}

	result := InitialProgressBootstrapResult{
		SlotFile:      slotFile,
		SaveFile:      filepath.Join(savesFolder, fmt.Sprintf("%d.celeste", slotFile)),
		ModSaveFile:   filepath.Join(savesFolder, fmt.Sprintf("%d-modsavedata.celeste", slotFile)),
		DashCountFile: filepath.Join(savesFolder, fmt.Sprintf("%d-modsave-DashCountMod.celeste", slotFile)),
	}

	entries, err := readInitialProgressEntries(result.SaveFile, result.ModSaveFile)
	if err != nil {
		return result, err
	}

	dashCounts, jumpCounts, dashCountFound := readDashCountModStats(result.DashCountFile)
	result.DashCountFound = dashCountFound
	if dashCountFound {
		for key, entry := range entries {
			if sideCounts, ok := dashCounts[entry.ChapterSID]; ok {
				entry.Dashes = sideCounts[entry.SideID]
			}
			if sideCounts, ok := jumpCounts[entry.ChapterSID]; ok {
				entry.Jumps = sideCounts[entry.SideID]
			}
			entries[key] = entry
		}
	}

	result, err = insertInitialProgressEntries(result, entries)
	if err != nil {
		return result, err
	}

	assetIndex, err := Asset_IndexInstalledMods()
	if err != nil {
		return result, err
	}
	result.AssetIndex = assetIndex

	return result, nil
}

func readInitialProgressEntries(saveFile, modSaveFile string) (map[string]initialProgressEntry, error) {
	if !FileExists(saveFile) {
		return nil, fmt.Errorf("save file not found: %s", saveFile)
	}

	entries := make(map[string]initialProgressEntry)
	saveData := initialProgressSaveXML{}
	if err := readXMLFile(saveFile, &saveData); err != nil {
		return nil, err
	}

	mergeInitialProgressAreas(entries, "Celeste", saveData.Areas)
	for _, levelSet := range saveData.LevelSets {
		mergeInitialProgressAreas(entries, levelSet.Name, levelSet.Areas)
	}

	if FileExists(modSaveFile) {
		modSaveData := initialProgressModSaveXML{}
		if err := readXMLFile(modSaveFile, &modSaveData); err != nil {
			return nil, err
		}
		for _, levelSet := range modSaveData.LevelSets {
			mergeInitialProgressAreas(entries, levelSet.Name, levelSet.Areas)
		}
	}

	for key, entry := range entries {
		if !entry.Played {
			delete(entries, key)
		}
	}

	return entries, nil
}

func readXMLFile(filePath string, target any) error {
	bytes, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}
	if err := xml.Unmarshal(bytes, target); err != nil {
		return fmt.Errorf("failed to parse %s: %w", filePath, err)
	}
	return nil
}

func mergeInitialProgressAreas(entries map[string]initialProgressEntry, campaignName string, areas []initialProgressAreaXML) {
	campaignName = strings.TrimSpace(campaignName)
	if campaignName == "" {
		return
	}

	for _, area := range areas {
		chapterSID := strings.TrimSpace(area.SID)
		if chapterSID == "" {
			continue
		}
		for sideIndex, mode := range area.Modes {
			sideID, ok := initialProgressSideID(sideIndex)
			if !ok {
				continue
			}

			collected := mode.TotalStrawberries
			if len(mode.Strawberries) > collected {
				collected = len(mode.Strawberries)
			}
			entry := initialProgressEntry{
				CampaignName:       campaignName,
				ChapterSID:         chapterSID,
				SideID:             sideID,
				BerriesCollected:   collected,
				BerriesAvailable:   collected,
				HeartCollected:     mode.HeartGem,
				Deaths:             mode.Deaths,
				Dashes:             mode.BestDashes,
				DurationMs:         ticksToMilliseconds(mode.TimePlayedTicks),
				Completed:          mode.Completed,
				SingleRunCompleted: mode.SingleRunCompleted,
				FullClear:          mode.FullClear,
				Played:             initialProgressModeWasPlayed(mode, collected),
			}
			key := initialProgressEntryKey(campaignName, chapterSID, sideID)
			entries[key] = mergeInitialProgressEntry(entries[key], entry)
		}
	}
}

func initialProgressModeWasPlayed(mode initialProgressAreaModeXML, berriesCollected int) bool {
	return mode.Completed ||
		mode.SingleRunCompleted ||
		mode.FullClear ||
		mode.Deaths > 0 ||
		mode.TimePlayedTicks > 0 ||
		mode.BestDashes > 0 ||
		mode.BestDeaths > 0 ||
		mode.HeartGem ||
		berriesCollected > 0
}

func mergeInitialProgressEntry(a, b initialProgressEntry) initialProgressEntry {
	if a.CampaignName == "" {
		return b
	}
	a.BerriesCollected = maxInt(a.BerriesCollected, b.BerriesCollected)
	a.BerriesAvailable = maxInt(a.BerriesAvailable, b.BerriesAvailable)
	a.Deaths = maxInt(a.Deaths, b.Deaths)
	a.Dashes = maxInt(a.Dashes, b.Dashes)
	a.Jumps = maxInt(a.Jumps, b.Jumps)
	a.DurationMs = maxInt64(a.DurationMs, b.DurationMs)
	a.HeartCollected = a.HeartCollected || b.HeartCollected
	a.GoldenCollected = a.GoldenCollected || b.GoldenCollected
	a.Played = a.Played || b.Played
	a.Completed = a.Completed || b.Completed
	a.SingleRunCompleted = a.SingleRunCompleted || b.SingleRunCompleted
	a.FullClear = a.FullClear || b.FullClear
	return a
}

func insertInitialProgressEntries(result InitialProgressBootstrapResult, entries map[string]initialProgressEntry) (InitialProgressBootstrapResult, error) {
	_db := Db_GetConnection()
	if _db == nil {
		return result, fmt.Errorf("database unavailable")
	}

	tx, err := _db.Beginx()
	if err != nil {
		return result, err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		return result, err
	}
	for _, sideID := range []string{"SIDEA", "SIDEB", "SIDEC"} {
		if _, err := tx.Exec(`INSERT OR IGNORE INTO ChapterSideTypes (id) VALUES (?)`, sideID); err != nil {
			return result, err
		}
	}

	saveDataID, err := ensureInitialProgressSaveData(tx, result.SlotFile)
	if err != nil {
		return result, err
	}

	campaignIDs := make(map[string]int)
	touchedCampaigns := make(map[int]bool)
	touchedChapters := make(map[string]bool)
	touchedSides := make(map[string]bool)

	for _, entry := range entries {
		campaignID, ok := campaignIDs[entry.CampaignName]
		if !ok {
			campaignID, err = ensureInitialProgressCampaign(tx, saveDataID, entry.CampaignName)
			if err != nil {
				return result, err
			}
			campaignIDs[entry.CampaignName] = campaignID
		}
		touchedCampaigns[campaignID] = true

		dbChapterSID := fmt.Sprintf("%d:%s", campaignID, entry.ChapterSID)
		if err := ensureInitialProgressChapter(tx, dbChapterSID, campaignID, entry.ChapterSID); err != nil {
			return result, err
		}
		touchedChapters[dbChapterSID] = true

		if err := upsertInitialProgressChapterSide(tx, dbChapterSID, entry); err != nil {
			return result, err
		}
		touchedSides[dbChapterSID+"|"+entry.SideID] = true

		if err := ensureInitialProgressRoom(tx, dbChapterSID, entry.SideID); err != nil {
			return result, err
		}

		sessionInserted, err := insertInitialProgressSession(tx, result.SlotFile, dbChapterSID, entry)
		if err != nil {
			return result, err
		}
		if sessionInserted {
			result.SessionsInserted++
			result.RoomStatsInserted++
		}
	}

	if err := tx.Commit(); err != nil {
		return result, err
	}

	result.CampaignsTouched = len(touchedCampaigns)
	result.ChaptersTouched = len(touchedChapters)
	result.SidesTouched = len(touchedSides)
	return result, nil
}

type initialProgressTx interface {
	Exec(query string, args ...any) (sql.Result, error)
	Get(dest any, query string, args ...any) error
}

func ensureInitialProgressUser(tx initialProgressTx, playerName string) (int, error) {
	if _, err := tx.Exec(`INSERT OR IGNORE INTO Users (name) VALUES (?)`, playerName); err != nil {
		return 0, err
	}
	var id int
	err := tx.Get(&id, `SELECT id FROM Users WHERE name = ? LIMIT 1`, playerName)
	return id, err
}

func ensureInitialProgressSaveData(tx initialProgressTx, slotFile int) (int, error) {
	fileName := fmt.Sprintf("%d.celeste", slotFile)
	var id int
	err := tx.Get(&id, `SELECT id FROM SaveDatas WHERE slot_number = ? ORDER BY id LIMIT 1`, slotFile)
	if err == nil {
		return id, nil
	}
	if err != sql.ErrNoRows {
		return 0, err
	}
	userID, err := ensureInitialProgressUser(tx, currentSystemUserName())
	if err != nil {
		return 0, err
	}
	res, err := tx.Exec(`INSERT INTO SaveDatas (user_id, slot_number, file_name) VALUES (?, ?, ?)`, userID, slotFile, fileName)
	if err != nil {
		return 0, err
	}
	lastID, err := res.LastInsertId()
	return int(lastID), err
}

func currentSystemUserName() string {
	for _, envName := range []string{"USERNAME", "USER"} {
		if value := strings.TrimSpace(os.Getenv(envName)); value != "" {
			return value
		}
	}
	return "Celeste Player"
}

func ensureInitialProgressCampaign(tx initialProgressTx, saveDataID int, campaignName string) (int, error) {
	var id int
	err := tx.Get(&id, `SELECT id FROM Campaigns WHERE save_data_id = ? AND campaign_name_id = ? LIMIT 1`, saveDataID, campaignName)
	if err == nil {
		return id, nil
	}
	if err != sql.ErrNoRows {
		return 0, err
	}
	res, err := tx.Exec(`INSERT INTO Campaigns (save_data_id, campaign_name_id) VALUES (?, ?)`, saveDataID, campaignName)
	if err != nil {
		return 0, err
	}
	lastID, err := res.LastInsertId()
	return int(lastID), err
}

func ensureInitialProgressChapter(tx initialProgressTx, dbChapterSID string, campaignID int, rawChapterSID string) error {
	_, err := tx.Exec(
		`INSERT INTO Chapters (sid, campaign_id, name) VALUES (?, ?, ?)
		ON CONFLICT(sid) DO UPDATE SET
			name = excluded.name`,
		dbChapterSID,
		campaignID,
		initialProgressChapterName(rawChapterSID),
	)
	return err
}

func upsertInitialProgressChapterSide(tx initialProgressTx, dbChapterSID string, entry initialProgressEntry) error {
	_, err := tx.Exec(`
		INSERT INTO ChapterSides (
			chapter_sid,
			side_id,
			berries_available,
			berries_collected,
			heart_collected,
			goldenstrawberry_achieved,
			goldenwingstrawberry_achieved
		) VALUES (?, ?, ?, ?, ?, ?, 0)
		ON CONFLICT(chapter_sid, side_id) DO UPDATE SET
			berries_available = MAX(berries_available, excluded.berries_available),
			berries_collected = MAX(berries_collected, excluded.berries_collected),
			heart_collected = MAX(heart_collected, excluded.heart_collected),
			goldenstrawberry_achieved = MAX(goldenstrawberry_achieved, excluded.goldenstrawberry_achieved)
	`,
		dbChapterSID,
		entry.SideID,
		entry.BerriesAvailable,
		entry.BerriesCollected,
		boolToInt(entry.HeartCollected),
		boolToInt(entry.GoldenCollected),
	)
	return err
}

func ensureInitialProgressRoom(tx initialProgressTx, dbChapterSID, sideID string) error {
	_, err := tx.Exec(`
		INSERT OR IGNORE INTO ChapterSideRooms (
			chapter_sid,
			side_id,
			name,
			"order",
			strawberries_available
		) VALUES (?, ?, ?, 0, 0)
	`, dbChapterSID, sideID, initialProgressRoomName)
	return err
}

func insertInitialProgressSession(tx initialProgressTx, slotFile int, dbChapterSID string, entry initialProgressEntry) (bool, error) {
	sessionID := initialProgressSessionID(slotFile, dbChapterSID, entry.SideID)
	res, err := tx.Exec(`
		INSERT OR IGNORE INTO GameSessions (
			id,
			chapter_sid,
			side_id,
			date_time_start,
			duration_ms,
			is_goldenberry_attempt,
			is_goldenberry_completed
		) VALUES (?, ?, ?, ?, ?, 0, ?)
	`,
		sessionID,
		dbChapterSID,
		entry.SideID,
		time.Now().Format(time.RFC3339),
		entry.DurationMs,
		boolToInt(entry.GoldenCollected),
	)
	if err != nil {
		return false, err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	if rowsAffected == 0 {
		return false, nil
	}

	_, err = tx.Exec(`
		INSERT INTO GameSessionChapterRoomStats (
			gamesession_id,
			chapter_sid,
			side_id,
			room_name,
			deaths_in_room,
			dashes_in_room,
			strawberries_achieved_in_room,
			hearts_achieved_in_room,
			jumps_in_room
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`,
		sessionID,
		dbChapterSID,
		entry.SideID,
		initialProgressRoomName,
		entry.Deaths,
		entry.Dashes,
		entry.BerriesCollected,
		boolToInt(entry.HeartCollected),
		entry.Jumps,
	)
	return true, err
}

func readDashCountModStats(filePath string) (map[string]map[string]int, map[string]map[string]int, bool) {
	dashCounts := make(map[string]map[string]int)
	jumpCounts := make(map[string]map[string]int)
	bytes, err := os.ReadFile(filePath)
	if err != nil {
		return dashCounts, jumpCounts, false
	}

	currentSection := ""
	currentSID := ""
	for _, rawLine := range strings.Split(string(bytes), "\n") {
		line := strings.TrimRight(rawLine, "\r")
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		if !strings.HasPrefix(line, " ") && strings.HasSuffix(trimmed, ":") {
			section := strings.TrimSuffix(trimmed, ":")
			if section == "DashCountPerLevel" || section == "JumpCountPerLevel" {
				currentSection = section
			} else {
				currentSection = ""
			}
			currentSID = ""
			continue
		}
		if currentSection == "" {
			continue
		}
		if strings.HasPrefix(line, "  ") && !strings.HasPrefix(line, "    ") && strings.HasSuffix(trimmed, ":") {
			currentSID = strings.TrimSuffix(trimmed, ":")
			continue
		}
		if currentSID == "" || !strings.HasPrefix(line, "    ") {
			continue
		}

		parts := strings.SplitN(trimmed, ":", 2)
		if len(parts) != 2 {
			continue
		}
		sideID, ok := initialProgressSideNameToID(strings.TrimSpace(parts[0]))
		if !ok {
			continue
		}
		value, err := strconv.Atoi(strings.TrimSpace(parts[1]))
		if err != nil {
			continue
		}
		target := dashCounts
		if currentSection == "JumpCountPerLevel" {
			target = jumpCounts
		}
		if target[currentSID] == nil {
			target[currentSID] = make(map[string]int)
		}
		target[currentSID][sideID] = value
	}

	return dashCounts, jumpCounts, true
}

func initialProgressSideID(sideIndex int) (string, bool) {
	switch sideIndex {
	case 0:
		return "SIDEA", true
	case 1:
		return "SIDEB", true
	case 2:
		return "SIDEC", true
	default:
		return "", false
	}
}

func initialProgressSideNameToID(sideName string) (string, bool) {
	switch strings.ToLower(strings.TrimSpace(sideName)) {
	case "normal", "sidea", "a", "a-side":
		return "SIDEA", true
	case "bside", "sideb", "b", "b-side":
		return "SIDEB", true
	case "cside", "sidec", "c", "c-side":
		return "SIDEC", true
	default:
		return "", false
	}
}

func initialProgressEntryKey(campaignName, chapterSID, sideID string) string {
	return campaignName + "\x00" + chapterSID + "\x00" + sideID
}

func initialProgressChapterName(chapterSID string) string {
	trimmed := strings.Trim(chapterSID, `/\`)
	if trimmed == "" {
		return chapterSID
	}

	if name, ok := vanillaChapterNames[trimmed]; ok {
		return name
	}

	parts := strings.FieldsFunc(trimmed, func(r rune) bool {
		return r == '/' || r == '\\'
	})
	name := parts[len(parts)-1]
	if displayName, ok := vanillaChapterNames[name]; ok {
		return displayName
	}
	return name
}

var vanillaChapterNames = map[string]string{
	"0-Intro":           "Prologue",
	"1-ForsakenCity":    "Forsaken City",
	"2-OldSite":         "Old Site",
	"3-CelestialResort": "Celestial Resort",
	"4-GoldenRidge":     "Golden Ridge",
	"5-MirrorTemple":    "Mirror Temple",
	"6-Reflection":      "Reflection",
	"7-Summit":          "The Summit",
	"8-Epilogue":        "Epilogue",
	"9-Core":            "Core",
	"10-Farewell":       "Farewell",
	"LostLevels":        "Farewell",
}

func initialProgressSessionID(slotFile int, dbChapterSID, sideID string) string {
	hash := sha1.Sum([]byte(fmt.Sprintf("%d|%s|%s", slotFile, dbChapterSID, sideID)))
	return "initial-progress-" + hex.EncodeToString(hash[:])[:24]
}

func ticksToMilliseconds(ticks int64) int64 {
	if ticks <= 0 {
		return 0
	}
	return ticks / 10000
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func maxInt(a, b int) int {
	if b > a {
		return b
	}
	return a
}

func maxInt64(a, b int64) int64 {
	if b > a {
		return b
	}
	return a
}
