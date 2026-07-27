# Mod Metadata `isMapMod` Discriminator

## Context
Not all Celeste mods contain map files under `Maps/` (e.g. helper mods, code-only mods, audio mods, texture/asset mods). Assuming every mod is a map mod with either `isLobby: true` or `isLobby: false` caused non-map mods to carry empty map arrays (`chapters: []`, `campaigns: []`).

## Strategy
1. **Discriminated Union Structure**:
   `ModMetadata` is now a 3-way discriminated union of `NonMapModMetadata`, `CollabModMetadata`, and `StandaloneMapModMetadata`.
   - `isMapMod: false` & `isLobby: false`: Non-map mod (helper, code, audio, asset mods).
   - `isMapMod: true` & `isLobby: true`: Collab mod with `lobbyChapters`, `collabId`, `lobbies`, `gyms`, `prologue?`.
   - `isMapMod: true` & `isLobby: false`: Standalone map mod with `chapters`, `campaigns`.
2. **Common Base Metadata**:
   All 3 variants inherit `CommonModMetadata` (`name`, `version`, `dll?`, `dependencies`, `optionalDependencies?`, `[key: string]: unknown`), allowing safe direct property access without conditional narrowing.
3. **Helper Functions**:
   `GetLevelSetNamesForMod` guards `if (!meta || !meta.isMapMod) return [];` to cleanly return empty level set names for non-map mods.
