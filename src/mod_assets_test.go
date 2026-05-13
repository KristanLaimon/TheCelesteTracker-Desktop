package src

import "testing"

func TestResolveChapterIconAssetFallsBackToSIDDerivedIcon(t *testing.T) {
	source := &modAssetSource{
		modID: "ExampleMod",
		entries: map[string]string{
			"graphics/atlases/gui/areas/author/campaign/map_icon.png": "Graphics/Atlases/Gui/areas/author/campaign/map_icon.png",
		},
	}

	ref, ok := resolveChapterIconAsset(source, map[string]modAssetRef{}, mapAssetMetadata{}, "author/campaign/map")
	if !ok {
		t.Fatal("expected SID fallback icon to resolve")
	}
	if ref.name != "Graphics/Atlases/Gui/areas/author/campaign/map_icon.png" {
		t.Fatalf("unexpected icon path: %s", ref.name)
	}
}

func TestParseStrawberryJamStickerPathsFromMeta(t *testing.T) {
	meta := `
Stickers:
  - Path: SJ2021/1-Beginner/Asterisk
    FinishedMaps:
    - StrawberryJam2021/1-Beginner/asteriskblue
    X: 120
  - Path: "SJ2021/1-Beginner/BingOverGoogle"
    FinishedMaps:
    - "StrawberryJam2021/1-Beginner/Bing_Over_Google"
`

	stickers := parseStrawberryJamStickerPathsFromMeta(meta)
	if stickers["StrawberryJam2021/1-Beginner/asteriskblue"] != "SJ2021/1-Beginner/Asterisk" {
		t.Fatalf("missing asterisk sticker mapping: %#v", stickers)
	}
	if stickers["StrawberryJam2021/1-Beginner/Bing_Over_Google"] != "SJ2021/1-Beginner/BingOverGoogle" {
		t.Fatalf("missing quoted sticker mapping: %#v", stickers)
	}
}

func TestResolveStrawberryJamCheckpointIconAssetFallsBackToStart(t *testing.T) {
	source := &modAssetSource{
		modID: "StrawberryJam2021",
		entries: map[string]string{
			"graphics/atlases/checkpoints/strawberryjam2021/1-beginner/zz-heartside/a/start.png": "Graphics/Atlases/Checkpoints/StrawberryJam2021/1-Beginner/ZZ-HeartSide/A/Start.png",
		},
	}

	ref, ok := resolveStrawberryJamCheckpointIconAsset(source, map[string]modAssetRef{}, "StrawberryJam2021/1-Beginner/ZZ-HeartSide")
	if !ok {
		t.Fatal("expected checkpoint start fallback to resolve")
	}
	if ref.name != "Graphics/Atlases/Checkpoints/StrawberryJam2021/1-Beginner/ZZ-HeartSide/A/Start.png" {
		t.Fatalf("unexpected checkpoint fallback path: %s", ref.name)
	}
}
