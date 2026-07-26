# 09. Celeste Save XML and Modsave YAML Stats Extraction

## Learnings
1. **Save Data Boundaries**:
   - `.celeste` XML save files (`Saves/<slot>.celeste`) store static campaign totals (`Deaths`, `TimePlayed` in 100ns ticks, `BestDeaths`, `HeartGem`, `Strawberries` entity IDs) across vanilla and installed/recycled mod campaigns.
   - Everest modsave YAML files (`Saves/<slot>-modsave-<ModName>.celeste`, e.g., `CollabUtils2`) store custom mod-specific progression (`SpeedBerryPBs`, `OpenedMiniHeartDoors`, `CombinedRainbowBerries`).
   - `TheCelesteTracker` SQLite DB (`CTDB`) is reserved for fine-grained session history over time and room-by-room heatmaps, separated from static global save statistics retrieval.

2. **Discriminated Union Types**:
   - Tagging `ModStatisticsResult` with `isVanilla: true` (`VanillaModStatisticsResult`), `isLobbyMod: true` (`LobbyModStatisticsResult`), or `isLobbyMod: false` (`StandaloneModStatisticsResult`) enforces type-safe access without optional chaining or null assertions.

3. **Helper Encapsulation**:
   - Modsave reading (`ReadModSaveData`) lives in `Everest.ts` as an Everest-specific feature, using `this.celesteDep.GetSavesFolderPath()`.

4. **Single Slot Architecture & Verified SID Table**:
   - `GetStatisticsByModId` requires an explicit `saveSlot: number`. Cross-slot merging is eliminated.
   - `<TotalDeaths>`, `<TotalDashes>`, `<TotalJumps>`, and `<Time>` in top-level `<SaveData>` cover **all** campaigns in that save slot (including mods). `saveWideDashes` and `saveWideJumps` live at the result root. Campaign deaths and playtime are summed strictly from campaign `<Areas>` `AreaModeStats`.
   - Per-side `AreaModeStats` has `BestDashes` (kept on `ChapterSideStats`), but no per-side total `Dashes` or `Jumps` attributes.
   - Verified Vanilla SIDs and Red-Berry table:
     - `Celeste/0-Intro` (Prologue): A-side only, 0 red, no heart, no golden.
     - `Celeste/1-ForsakenCity`: A/B/C, A maxRed = 20 (22 collected = 20 red + 1:12 golden + end:4 winged).
     - `Celeste/2-OldSite`: A/B/C, A maxRed = 18.
     - `Celeste/3-CelestialResort`: A/B/C, A maxRed = 25.
     - `Celeste/4-GoldenRidge`: A/B/C, A maxRed = 29.
     - `Celeste/5-MirrorTemple`: A/B/C, A maxRed = 31.
     - `Celeste/6-Reflection`: A/B/C, A maxRed = 0.
     - `Celeste/7-Summit`: A/B/C, A maxRed = 47.
     - `Celeste/8-Epilogue`: A-side only, 0 red.
     - `Celeste/9-Core`: A/B/C, A maxRed = 5.
     - `Celeste/LostLevels` (Farewell): A-side only, 0 red, j-19:9 moon berry.
   - Phantom B/C sides on A-side-only chapters are omitted from `chapter.sides`.
