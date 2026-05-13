package strawberryjam

import (
	"testing"

	"TheCelesteTrackerDesktop/src/lobbies"
)

const (
	heartSideChapterSID = "StrawberryJam2021/1-Beginner/ZZ-HeartSide"
	checkpointStartKey  = "graphics/atlases/checkpoints/strawberryjam2021/1-beginner/zz-heartside/a/start.png"
	checkpointStartPath = "Graphics/Atlases/Checkpoints/StrawberryJam2021/1-Beginner/ZZ-HeartSide/A/Start.png"
	asteriskFinishedMap = "StrawberryJam2021/1-Beginner/asteriskblue"
	asteriskStickerPath = "SJ2021/1-Beginner/Asterisk"
	bingFinishedMap     = "StrawberryJam2021/1-Beginner/Bing_Over_Google"
	bingStickerPath     = "SJ2021/1-Beginner/BingOverGoogle"
)

const stickerMeta = `
Stickers:
  - Path: SJ2021/1-Beginner/Asterisk
    FinishedMaps:
    - StrawberryJam2021/1-Beginner/asteriskblue
    X: 120
  - Path: "SJ2021/1-Beginner/BingOverGoogle"
    FinishedMaps:
    - "StrawberryJam2021/1-Beginner/Bing_Over_Google"
`

func TestParseStickerPathsFromMeta(t *testing.T) {
	stickers := ParseStickerPathsFromMeta(stickerMeta)
	if stickers[asteriskFinishedMap] != asteriskStickerPath {
		t.Fatalf("missing asterisk sticker mapping: %#v", stickers)
	}
	if stickers[bingFinishedMap] != bingStickerPath {
		t.Fatalf("missing quoted sticker mapping: %#v", stickers)
	}
}

func TestResolveCheckpointIconAssetFallsBackToStart(t *testing.T) {
	ctx := testAssetContext{
		entries: map[string]string{
			checkpointStartKey: checkpointStartPath,
		},
		resolveAsset: func(archivePath string) (lobbies.AssetRef, bool) {
			if normalizeArchivePath(archivePath) != normalizeArchivePath(checkpointStartPath) {
				return lobbies.AssetRef{}, false
			}
			return lobbies.AssetRef{Name: checkpointStartPath}, true
		},
	}

	ref, ok := ResolveCheckpointIconAsset(ctx, heartSideChapterSID)
	if !ok {
		t.Fatal("expected checkpoint start fallback to resolve")
	}
	if ref.Name != checkpointStartPath {
		t.Fatalf("unexpected checkpoint fallback path: %s", ref.Name)
	}
}

type testAssetContext struct {
	entries      map[string]string
	globalAssets map[string]lobbies.AssetRef
	readText     func(name string) (string, bool)
	resolveAsset func(archivePath string) (lobbies.AssetRef, bool)
}

func (c testAssetContext) Entries() map[string]string {
	return c.entries
}

func (c testAssetContext) GlobalAssets() map[string]lobbies.AssetRef {
	return c.globalAssets
}

func (c testAssetContext) ReadText(name string) (string, bool) {
	if c.readText == nil {
		return "", false
	}
	return c.readText(name)
}

func (c testAssetContext) ResolveAsset(archivePath string) (lobbies.AssetRef, bool) {
	if c.resolveAsset == nil {
		return lobbies.AssetRef{}, false
	}
	return c.resolveAsset(archivePath)
}
