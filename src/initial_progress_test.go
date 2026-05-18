package src

import "testing"

func TestInitialProgressChapterNameUsesVanillaDisplayNames(t *testing.T) {
	tests := map[string]string{
		"0-Intro":            "Prologue",
		"2-OldSite":          "Old Site",
		"6-Reflection":       "Reflection",
		"LostLevels":         "Farewell",
		"Celeste/LostLevels": "Farewell",
	}

	for sid, expected := range tests {
		if actual := initialProgressChapterName(sid); actual != expected {
			t.Fatalf("initialProgressChapterName(%q) = %q, want %q", sid, actual, expected)
		}
	}
}
