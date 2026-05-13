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
