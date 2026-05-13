package src

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"TheCelesteTrackerDesktop/src/lobbies"
	"TheCelesteTrackerDesktop/src/strawberryjam"
)

const assetRootFolderName = "assets"

type modAssetSource struct {
	modID     string
	filePath  string
	isZip     bool
	zipReader *zip.ReadCloser
	entries   map[string]string
}

type modAssetRef struct {
	source *modAssetSource
	name   string
}

type modAssetLobbyContext struct {
	source       *modAssetSource
	globalAssets map[string]modAssetRef
	lobbyAssets  map[string]lobbies.AssetRef
}

type mapAssetMetadata struct {
	iconTexture string
	atlas       string
	images      []string
}

var lobbyChapterIconResolvers = []lobbies.ChapterIconResolver{
	strawberryjam.NewResolver(),
}

type ModAssetIndexResult struct {
	ModsScanned       int `json:"modsScanned"`
	ChaptersUpdated   int `json:"chaptersUpdated"`
	IconsCopied       int `json:"iconsCopied"`
	EndscreensCopied  int `json:"endscreensCopied"`
	AssetFilesIndexed int `json:"assetFilesIndexed"`
	ChaptersQueued    int `json:"chaptersQueued"`
	ChaptersAttempted int `json:"chaptersAttempted"`
	ChaptersSkipped   int `json:"chaptersSkipped"`
}

type modAssetIndexManifest struct {
	AttemptedChapters map[string]bool `json:"attemptedChapters"`
}

type trackedChapterAssetState struct {
	SID              string `db:"sid"`
	IconImgPath      string `db:"icon_img_path"`
	EndscreenImgPath string `db:"endscreen_img_path"`
}

func Asset_IndexInstalledMods() (ModAssetIndexResult, error) {
	modsFolder, err := GetCelesteModsFolder()
	if err != nil {
		return ModAssetIndexResult{}, err
	}

	appDataDir, err := GetExecutableDataDir()
	if err != nil {
		return ModAssetIndexResult{}, err
	}

	manifest := readModAssetIndexManifest(appDataDir)
	chapterWorklist, err := getChapterAssetWorklist(appDataDir, manifest)
	if err != nil {
		return ModAssetIndexResult{}, err
	}
	if len(chapterWorklist) == 0 {
		return ModAssetIndexResult{ChaptersQueued: 0}, nil
	}

	sources, err := openModAssetSources(modsFolder)
	if err != nil {
		return ModAssetIndexResult{}, err
	}
	defer closeModAssetSources(sources)

	globalAssets := make(map[string]modAssetRef)
	for i := range sources {
		for normalized, name := range sources[i].entries {
			if _, exists := globalAssets[normalized]; !exists {
				globalAssets[normalized] = modAssetRef{source: &sources[i], name: name}
			}
		}
	}

	result := ModAssetIndexResult{
		ModsScanned:       len(sources),
		AssetFilesIndexed: len(globalAssets),
		ChaptersQueued:    len(chapterWorklist),
	}

	for i := range sources {
		source := &sources[i]
		for normalized, entryName := range source.entries {
			if !strings.HasPrefix(normalized, "maps/") || !strings.HasSuffix(normalized, ".bin") {
				continue
			}

			mapSID := strings.TrimSuffix(strings.TrimPrefix(entryName, "Maps/"), path.Ext(entryName))
			chapterSID := canonicalChapterSID(mapSID)
			if len(chapterWorklist) > 0 && !chapterWorklist[chapterSID] {
				result.ChaptersSkipped++
				continue
			}
			metaName := strings.TrimSuffix(entryName, path.Ext(entryName)) + ".meta.yaml"
			metadata := mapAssetMetadata{}
			metaContent, ok := readSourceText(source, metaName)
			if ok {
				metadata = parseMapAssetMetadata(metaContent)
			}

			iconFileName := ""
			endscreenFileName := ""

			if ref, ok := resolveChapterIconAsset(source, globalAssets, metadata, chapterSID); ok {
				fileName := assetFileName(source.modID, chapterSID, "icon", path.Ext(ref.name))
				if err := copyModAssetRef(ref, appDataDir, source.modID, fileName); err != nil {
					LogError(fmt.Sprintf("[Mod Assets] Failed to copy icon %s: %s", ref.name, err))
				} else {
					iconFileName = fileName
					result.IconsCopied++
				}
			}

			if metadata.atlas != "" {
				if ref, ok := resolveEndscreenAsset(source, globalAssets, metadata); ok {
					fileName := assetFileName(source.modID, chapterSID, "endscreen", path.Ext(ref.name))
					if err := copyModAssetRef(ref, appDataDir, source.modID, fileName); err != nil {
						LogError(fmt.Sprintf("[Mod Assets] Failed to copy endscreen %s: %s", ref.name, err))
					} else {
						endscreenFileName = fileName
						result.EndscreensCopied++
					}
				}
			}

			if iconFileName != "" || endscreenFileName != "" {
				updated, err := updateChapterAssetNames(chapterSID, iconFileName, endscreenFileName)
				if err != nil {
					LogError(fmt.Sprintf("[Mod Assets] Failed to update chapter %s: %s", chapterSID, err))
					continue
				}
				result.ChaptersUpdated += updated
			}

			if len(chapterWorklist) > 0 {
				manifest.AttemptedChapters[chapterSID] = true
				result.ChaptersAttempted++
			}
		}
	}

	if err := writeModAssetIndexManifest(appDataDir, manifest); err != nil {
		LogError(fmt.Sprintf("[Mod Assets] Failed to write manifest: %s", err))
	}

	return result, nil
}

func GetExecutableDataDir() (string, error) {
	executablePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Join(filepath.Dir(executablePath), "data"), nil
}

func readModAssetIndexManifest(dataDir string) modAssetIndexManifest {
	manifest := modAssetIndexManifest{AttemptedChapters: make(map[string]bool)}
	bytes, err := os.ReadFile(filepath.Join(dataDir, assetRootFolderName, "asset_index_manifest.json"))
	if err != nil {
		return manifest
	}
	if err := json.Unmarshal(bytes, &manifest); err != nil {
		return modAssetIndexManifest{AttemptedChapters: make(map[string]bool)}
	}
	if manifest.AttemptedChapters == nil {
		manifest.AttemptedChapters = make(map[string]bool)
	}
	return manifest
}

func writeModAssetIndexManifest(dataDir string, manifest modAssetIndexManifest) error {
	targetDir := filepath.Join(dataDir, assetRootFolderName)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return err
	}
	bytes, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(targetDir, "asset_index_manifest.json"), bytes, 0644)
}

func getChapterAssetWorklist(dataDir string, manifest modAssetIndexManifest) (map[string]bool, error) {
	rows := make([]trackedChapterAssetState, 0)
	err := Db_Select(&rows, `
		SELECT
			sid,
			COALESCE(icon_img_path, '') as icon_img_path,
			COALESCE(endscreen_img_path, '') as endscreen_img_path
		FROM Chapters
	`)
	if err != nil {
		return nil, err
	}

	worklist := make(map[string]bool)
	for _, row := range rows {
		chapterSID := canonicalChapterSID(stripChapterSIDPrefix(row.SID))
		if chapterSID == "" {
			continue
		}
		if !manifest.AttemptedChapters[chapterSID] || indexedAssetFileMissing(dataDir, row.IconImgPath) || indexedAssetFileMissing(dataDir, row.EndscreenImgPath) {
			worklist[chapterSID] = true
		}
	}

	return worklist, nil
}

func indexedAssetFileMissing(dataDir, fileName string) bool {
	if fileName == "" {
		return false
	}
	for _, candidateDataDir := range append([]string{dataDir}, getCandidateDataDirs()...) {
		assetsDir := filepath.Join(candidateDataDir, assetRootFolderName)
		found := false
		_ = filepath.WalkDir(assetsDir, func(current string, d os.DirEntry, walkErr error) error {
			if walkErr != nil || d.IsDir() {
				return nil
			}
			if strings.EqualFold(d.Name(), fileName) {
				found = true
				return filepath.SkipAll
			}
			return nil
		})
		if found {
			return false
		}
	}
	return true
}

func stripChapterSIDPrefix(sid string) string {
	if idx := strings.Index(sid, ":"); idx >= 0 && idx+1 < len(sid) {
		return sid[idx+1:]
	}
	return sid
}

func GetIndexedAssetAsBase64(fileName string) (string, error) {
	if fileName == "" || strings.ContainsAny(fileName, `/\`) {
		return "", fmt.Errorf("invalid indexed asset file name")
	}

	var match string
	for _, dataDir := range getCandidateDataDirs() {
		assetsDir := filepath.Join(dataDir, assetRootFolderName)
		err := filepath.WalkDir(assetsDir, func(current string, d os.DirEntry, walkErr error) error {
			if walkErr != nil || d.IsDir() {
				return nil
			}
			if strings.EqualFold(d.Name(), fileName) {
				match = current
				return filepath.SkipAll
			}
			return nil
		})
		if err != nil || match == "" {
			continue
		}
		break
	}
	if match == "" {
		return "", fmt.Errorf("indexed asset not found: %s", fileName)
	}
	return GetAssetAsBase64(match)
}

func getCandidateDataDirs() []string {
	candidates := make([]string, 0, 3)
	seen := make(map[string]bool)
	add := func(path string) {
		if path == "" {
			return
		}
		cleaned, err := filepath.Abs(path)
		if err != nil {
			cleaned = filepath.Clean(path)
		}
		key := strings.ToLower(cleaned)
		if !seen[key] {
			seen[key] = true
			candidates = append(candidates, cleaned)
		}
	}

	if dataDir, err := GetExecutableDataDir(); err == nil {
		add(dataDir)
	}
	if cwd, err := os.Getwd(); err == nil {
		add(filepath.Join(cwd, "data"))
		add(filepath.Join(cwd, "build", "bin", "data"))
	}

	return candidates
}

func openModAssetSources(modsFolder string) ([]modAssetSource, error) {
	entries, err := os.ReadDir(modsFolder)
	if err != nil {
		return nil, err
	}

	sources := make([]modAssetSource, 0)
	for _, entry := range entries {
		fullPath := filepath.Join(modsFolder, entry.Name())
		if entry.IsDir() {
			source, ok := openDirectoryModSource(fullPath)
			if ok {
				sources = append(sources, source)
			}
			continue
		}
		if strings.EqualFold(filepath.Ext(entry.Name()), ".zip") {
			source, ok := openZipModSource(fullPath)
			if ok {
				sources = append(sources, source)
			}
		}
	}
	return sources, nil
}

func openZipModSource(filePath string) (modAssetSource, bool) {
	reader, err := zip.OpenReader(filePath)
	if err != nil {
		LogError(fmt.Sprintf("[Mod Assets] Skipping unreadable zip %s: %s", filePath, err))
		return modAssetSource{}, false
	}

	source := modAssetSource{
		filePath:  filePath,
		isZip:     true,
		zipReader: reader,
		entries:   make(map[string]string),
	}
	for _, file := range reader.File {
		if file.FileInfo().IsDir() {
			continue
		}
		name := normalizeArchivePath(file.Name)
		source.entries[strings.ToLower(name)] = name
	}
	source.modID = detectModID(&source, strings.TrimSuffix(filepath.Base(filePath), filepath.Ext(filePath)))
	return source, true
}

func openDirectoryModSource(dirPath string) (modAssetSource, bool) {
	source := modAssetSource{
		filePath: dirPath,
		isZip:    false,
		entries:  make(map[string]string),
	}
	_ = filepath.WalkDir(dirPath, func(current string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(dirPath, current)
		if err != nil {
			return nil
		}
		name := normalizeArchivePath(rel)
		source.entries[strings.ToLower(name)] = name
		return nil
	})
	if len(source.entries) == 0 {
		return modAssetSource{}, false
	}
	source.modID = detectModID(&source, filepath.Base(dirPath))
	return source, true
}

func closeModAssetSources(sources []modAssetSource) {
	for i := range sources {
		if sources[i].zipReader != nil {
			_ = sources[i].zipReader.Close()
		}
	}
}

func detectModID(source *modAssetSource, fallback string) string {
	for _, candidate := range []string{"everest.yaml", "everest.yml"} {
		content, ok := readSourceText(source, candidate)
		if !ok {
			continue
		}
		re := regexp.MustCompile(`(?m)^-\s*Name:\s*"?([^"\r\n#]+)"?\s*$`)
		if match := re.FindStringSubmatch(content); len(match) == 2 {
			return strings.TrimSpace(match[1])
		}
	}
	return fallback
}

func readSourceText(source *modAssetSource, name string) (string, bool) {
	reader, ok := openSourceEntry(source, name)
	if !ok {
		return "", false
	}
	defer reader.Close()
	bytes, err := io.ReadAll(reader)
	if err != nil {
		return "", false
	}
	return string(bytes), true
}

func openSourceEntry(source *modAssetSource, name string) (io.ReadCloser, bool) {
	normalized := strings.ToLower(normalizeArchivePath(name))
	actualName, ok := source.entries[normalized]
	if !ok {
		return nil, false
	}

	if source.isZip {
		for _, file := range source.zipReader.File {
			if normalizeArchivePath(file.Name) == actualName {
				reader, err := file.Open()
				return reader, err == nil
			}
		}
		return nil, false
	}

	file, err := os.Open(filepath.Join(source.filePath, filepath.FromSlash(actualName)))
	return file, err == nil
}

func parseMapAssetMetadata(content string) mapAssetMetadata {
	return mapAssetMetadata{
		iconTexture: parseTopLevelScalar(content, "Icon"),
		atlas:       parseCompleteScreenScalar(content, "Atlas"),
		images:      parseCompleteScreenImages(content),
	}
}

func parseTopLevelScalar(content, key string) string {
	re := regexp.MustCompile(`(?m)^` + regexp.QuoteMeta(key) + `:\s*["']?([^"'\r\n#]+)`)
	if match := re.FindStringSubmatch(content); len(match) == 2 {
		return strings.TrimSpace(match[1])
	}
	return ""
}

func parseCompleteScreenScalar(content, key string) string {
	inCompleteScreen := false
	for _, line := range strings.Split(content, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		if !strings.HasPrefix(line, " ") && !strings.HasPrefix(line, "\t") {
			inCompleteScreen = trimmed == "CompleteScreen:"
			continue
		}
		if inCompleteScreen && strings.HasPrefix(trimmed, key+":") {
			value := strings.TrimSpace(strings.TrimPrefix(trimmed, key+":"))
			return strings.Trim(value, `"'`)
		}
	}
	return ""
}

func parseCompleteScreenImages(content string) []string {
	inCompleteScreen := false
	for _, line := range strings.Split(content, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		if !strings.HasPrefix(line, " ") && !strings.HasPrefix(line, "\t") {
			inCompleteScreen = trimmed == "CompleteScreen:"
			continue
		}
		if inCompleteScreen && strings.HasPrefix(trimmed, "Images:") {
			value := strings.TrimSpace(strings.TrimPrefix(trimmed, "Images:"))
			return parseYamlInlineList(value)
		}
	}
	return []string{}
}

func parseYamlInlineList(value string) []string {
	value = strings.TrimSpace(value)
	value = strings.TrimPrefix(value, "[")
	value = strings.TrimSuffix(value, "]")
	parts := strings.Split(value, ",")
	items := make([]string, 0, len(parts))
	for _, part := range parts {
		item := strings.Trim(strings.TrimSpace(part), `"'`)
		if item != "" {
			items = append(items, item)
		}
	}
	return items
}

func resolveSourceOrGlobalAsset(source *modAssetSource, globalAssets map[string]modAssetRef, archivePath string) (modAssetRef, bool) {
	normalized := strings.ToLower(normalizeArchivePath(archivePath))
	if sourceName, ok := source.entries[normalized]; ok {
		return modAssetRef{source: source, name: sourceName}, true
	}
	ref, ok := globalAssets[normalized]
	return ref, ok
}

func resolveChapterIconAsset(source *modAssetSource, globalAssets map[string]modAssetRef, metadata mapAssetMetadata, chapterSID string) (modAssetRef, bool) {
	candidates := make([]string, 0, 4)
	if metadata.iconTexture != "" {
		candidates = append(candidates, guiAtlasPNGPath(metadata.iconTexture))
	}

	sid := strings.Trim(chapterSID, `/\`)
	baseName := path.Base(sid)
	baseDir := path.Dir(sid)
	if baseDir == "." {
		baseDir = ""
	}

	candidates = append(candidates,
		path.Join("Graphics/Atlases/Gui/areas", sid+"_icon.png"),
		path.Join("Graphics/Atlases/Gui/areas", sid+".png"),
		path.Join("Graphics/Atlases/Gui/areas", baseDir, baseName+"_icon.png"),
		path.Join("Graphics/Atlases/Gui/areas", baseDir, baseName+".png"),
	)

	seen := make(map[string]bool)
	for _, candidate := range candidates {
		normalized := strings.ToLower(normalizeArchivePath(candidate))
		if seen[normalized] {
			continue
		}
		seen[normalized] = true
		if ref, ok := resolveSourceOrGlobalAsset(source, globalAssets, candidate); ok {
			return ref, true
		}
	}

	lobbyCtx := newModAssetLobbyContext(source, globalAssets)
	for _, resolver := range lobbyChapterIconResolvers {
		if ref, ok := resolver.ResolveChapterIconAsset(lobbyCtx, chapterSID); ok {
			if modRef, ok := lobbyAssetRef(ref); ok {
				return modRef, true
			}
		}
	}

	return modAssetRef{}, false
}

func newModAssetLobbyContext(source *modAssetSource, globalAssets map[string]modAssetRef) modAssetLobbyContext {
	lobbyAssets := make(map[string]lobbies.AssetRef, len(globalAssets))
	for normalized, ref := range globalAssets {
		lobbyAssets[normalized] = lobbies.AssetRef{Name: ref.name, Payload: ref}
	}

	return modAssetLobbyContext{
		source:       source,
		globalAssets: globalAssets,
		lobbyAssets:  lobbyAssets,
	}
}

func (c modAssetLobbyContext) Entries() map[string]string {
	return c.source.entries
}

func (c modAssetLobbyContext) GlobalAssets() map[string]lobbies.AssetRef {
	return c.lobbyAssets
}

func (c modAssetLobbyContext) ReadText(name string) (string, bool) {
	return readSourceText(c.source, name)
}

func (c modAssetLobbyContext) ResolveAsset(archivePath string) (lobbies.AssetRef, bool) {
	ref, ok := resolveSourceOrGlobalAsset(c.source, c.globalAssets, archivePath)
	if !ok {
		return lobbies.AssetRef{}, false
	}
	return lobbies.AssetRef{Name: ref.name, Payload: ref}, true
}

func lobbyAssetRef(ref lobbies.AssetRef) (modAssetRef, bool) {
	modRef, ok := ref.Payload.(modAssetRef)
	if !ok {
		return modAssetRef{}, false
	}
	return modRef, true
}

func resolveEndscreenAsset(source *modAssetSource, globalAssets map[string]modAssetRef, metadata mapAssetMetadata) (modAssetRef, bool) {
	atlas := strings.Trim(metadata.atlas, `/\`)
	for _, image := range metadata.images {
		candidate := archivePNGPath(path.Join("Graphics/Atlases", atlas, strings.Trim(image, `/\`)))
		if ref, ok := resolveSourceOrGlobalAsset(source, globalAssets, candidate); ok {
			return ref, true
		}
	}

	prefix := strings.ToLower(normalizeArchivePath(path.Join("Graphics/Atlases", atlas))) + "/"
	candidates := make([]string, 0)
	for normalized := range globalAssets {
		if strings.HasPrefix(normalized, prefix) && strings.HasSuffix(normalized, ".png") {
			candidates = append(candidates, normalized)
		}
	}
	sort.Strings(candidates)
	if len(candidates) == 0 {
		return modAssetRef{}, false
	}
	return globalAssets[candidates[0]], true
}

func copyModAssetRef(ref modAssetRef, dataDir, modID, fileName string) error {
	reader, ok := openSourceEntry(ref.source, ref.name)
	if !ok {
		return fmt.Errorf("asset entry not found: %s", ref.name)
	}
	defer reader.Close()

	targetDir := filepath.Join(dataDir, assetRootFolderName, sanitizePathSegment(modID))
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return err
	}
	targetPath := filepath.Join(targetDir, fileName)
	file, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = io.Copy(file, reader)
	return err
}

func updateChapterAssetNames(chapterSID, iconFileName, endscreenFileName string) (int, error) {
	sets := make([]string, 0, 2)
	args := make([]any, 0, 4)
	if iconFileName != "" {
		sets = append(sets, "icon_img_path = ?")
		args = append(args, iconFileName)
	}
	if endscreenFileName != "" {
		sets = append(sets, "endscreen_img_path = ?")
		args = append(args, endscreenFileName)
	}
	if len(sets) == 0 {
		return 0, nil
	}

	args = append(args, chapterSID, "%:"+chapterSID)
	result, err := Db_Exec(`UPDATE Chapters SET `+strings.Join(sets, ", ")+` WHERE sid = ? OR sid LIKE ?`, args...)
	if err != nil {
		return 0, err
	}
	return int(result.RowsAffected), nil
}

func canonicalChapterSID(mapSID string) string {
	if strings.HasSuffix(mapSID, "-B") || strings.HasSuffix(mapSID, "-C") {
		return mapSID[:len(mapSID)-2]
	}
	return mapSID
}

func guiAtlasPNGPath(texture string) string {
	texture = strings.TrimSpace(strings.Trim(texture, `"'`))
	texture = strings.TrimPrefix(texture, "Gui/")
	return archivePNGPath(path.Join("Graphics/Atlases/Gui", texture))
}

func archivePNGPath(value string) string {
	value = normalizeArchivePath(value)
	if !strings.EqualFold(path.Ext(value), ".png") {
		value += ".png"
	}
	return value
}

func assetFileName(modID, sid, kind, ext string) string {
	if ext == "" {
		ext = ".png"
	}
	return sanitizePathSegment(modID+"__"+sid+"__"+kind) + strings.ToLower(ext)
}

func sanitizePathSegment(value string) string {
	replacer := strings.NewReplacer(
		"/", "_",
		"\\", "_",
		":", "_",
		"*", "_",
		"?", "_",
		"\"", "_",
		"<", "_",
		">", "_",
		"|", "_",
		" ", "_",
	)
	return strings.Trim(replacer.Replace(value), "._")
}

func normalizeArchivePath(value string) string {
	return path.Clean(strings.ReplaceAll(value, "\\", "/"))
}
