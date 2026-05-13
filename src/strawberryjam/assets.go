package strawberryjam

import (
	"path"
	"sort"
	"strings"

	"TheCelesteTrackerDesktop/src/lobbies"
)

const ModID = "StrawberryJam2021"

type Resolver struct{}

func NewResolver() Resolver {
	return Resolver{}
}

func (r Resolver) ResolveChapterIconAsset(ctx lobbies.AssetContext, chapterSID string) (lobbies.AssetRef, bool) {
	const strawberryJamPrefix = ModID + "/"
	if !strings.HasPrefix(chapterSID, strawberryJamPrefix) {
		return lobbies.AssetRef{}, false
	}

	parts := strings.Split(chapterSID, "/")
	if len(parts) != 3 {
		return lobbies.AssetRef{}, false
	}

	group := parts[1]
	mapName := parts[2]
	if group == "0-Lobbies" {
		return ctx.ResolveAsset(path.Join("Graphics/Atlases/Gui/areas/SJ2021/lobby", mapName+".png"))
	}
	if group == "0-Gyms" {
		return ctx.ResolveAsset(path.Join("Graphics/Atlases/Gui/areas/SJ2021/gym", mapName+".png"))
	}

	stickerPaths := parseStickerPaths(ctx)
	stickerPath, ok := stickerPaths[chapterSID]
	if ok {
		if ref, ok := ctx.ResolveAsset(path.Join("Graphics/Atlases/Stickers", stickerPath+".png")); ok {
			return ref, true
		}
	}

	return ResolveCheckpointIconAsset(ctx, chapterSID)
}

func ResolveCheckpointIconAsset(ctx lobbies.AssetContext, chapterSID string) (lobbies.AssetRef, bool) {
	prefix := strings.ToLower(normalizeArchivePath(path.Join("Graphics/Atlases/Checkpoints", chapterSID, "A"))) + "/"
	preferred := []string{
		path.Join("Graphics/Atlases/Checkpoints", chapterSID, "A", "Start.png"),
		path.Join("Graphics/Atlases/Checkpoints", chapterSID, "A", "start.png"),
	}

	for _, candidate := range preferred {
		if ref, ok := ctx.ResolveAsset(candidate); ok {
			return ref, true
		}
	}

	candidates := make([]string, 0)
	for normalized := range ctx.GlobalAssets() {
		if strings.HasPrefix(normalized, prefix) && strings.HasSuffix(normalized, ".png") {
			candidates = append(candidates, normalized)
		}
	}
	sort.Strings(candidates)
	if len(candidates) == 0 {
		return lobbies.AssetRef{}, false
	}

	return ctx.GlobalAssets()[candidates[0]], true
}

func ParseStickerPathsFromMeta(content string) map[string]string {
	stickers := make(map[string]string)
	currentPath := ""
	inFinishedMaps := false

	for _, line := range strings.Split(content, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		if strings.HasPrefix(trimmed, "- Path:") || strings.HasPrefix(trimmed, "Path:") {
			parts := strings.SplitN(trimmed, ":", 2)
			currentPath = strings.Trim(strings.TrimSpace(parts[1]), `"'`)
			inFinishedMaps = false
			continue
		}

		if strings.HasPrefix(trimmed, "FinishedMaps:") {
			inFinishedMaps = true
			continue
		}

		if inFinishedMaps && strings.HasPrefix(trimmed, "- ") && currentPath != "" {
			finishedMap := strings.Trim(strings.TrimSpace(strings.TrimPrefix(trimmed, "- ")), `"'`)
			if finishedMap != "" {
				stickers[finishedMap] = currentPath
			}
			continue
		}

		if inFinishedMaps && !strings.HasPrefix(trimmed, "- ") {
			inFinishedMaps = false
		}
	}

	return stickers
}

func parseStickerPaths(ctx lobbies.AssetContext) map[string]string {
	stickers := make(map[string]string)
	for normalized, entryName := range ctx.Entries() {
		if !strings.HasPrefix(normalized, "maps/strawberryjam2021/0-lobbies/") || !strings.HasSuffix(normalized, ".meta.yaml") {
			continue
		}

		content, ok := ctx.ReadText(entryName)
		if !ok {
			continue
		}
		for finishedMap, stickerPath := range ParseStickerPathsFromMeta(content) {
			stickers[finishedMap] = stickerPath
		}
	}
	return stickers
}

func normalizeArchivePath(value string) string {
	value = strings.ReplaceAll(value, "\\", "/")
	value = path.Clean(value)
	value = strings.TrimPrefix(value, "./")
	if value == "." {
		return ""
	}
	return value
}
