# Initial Progress Bootstrap

The desktop app performs a one-time initial progress import per configured Celeste save slot. The import exists because Celeste and Everest already store historical progress for maps that were played before `TheCelesteTracker` started recording detailed room sessions.

## Configuration

`config.json` owns the startup gate:

- `selected_save_slotfile`: numeric Celeste save slot to import and use. The code default is `0`.
- `initial_progress_scrapping_made`: legacy/global marker that becomes `true` after any slot bootstrap completes.
- `initial_progress_scrapping_made_by_slotfile`: per-slot completion map. This is the authoritative gate.

Example:

```json
{
  "DatabaseAlreadyAppended": true,
  "initial_progress_scrapping_made": false,
  "initial_progress_scrapping_made_by_slotfile": {
    "1": true
  },
  "selected_save_slotfile": 1
}
```

If slot `1` is marked complete and the user later switches `selected_save_slotfile` to `0`, slot `0` is still eligible for its own one-time bootstrap.

## Save Files

For slot `N`, the importer reads only files for that slot:

- `N.celeste`: main Celeste save file. It contains vanilla progress in `Areas` and may also contain modded `LevelSets` in current Everest saves.
- `N-modsavedata.celeste`: Everest modded progress by `LevelSetStats`. This is the primary mod progress file when present.
- `N-modsave-DashCountMod.celeste`: optional DashCountMod data. When present, `DashCountPerLevel` and `JumpCountPerLevel` provide better per-map dash and jump totals.

Other slot-scoped files such as `N-modsave-*.celeste` and `N-modsession-*.celeste` are mod-owned state/session files. They are not treated as a generic progress source because their shape is mod-specific. `modsettings-*.celeste` files are settings, not save-slot progress.

## Database Import Shape

The bootstrap does not change the database schema.

For each played chapter side found in the selected slot, it creates or reuses:

- `Users`
- `SaveDatas`
- `Campaigns`
- `Chapters`
- `ChapterSides`
- one synthetic `ChapterSideRooms` row named `__initial_save_import__`
- one deterministic synthetic `GameSessions` row
- one `GameSessionChapterRoomStats` row attached to that synthetic session

If a `SaveDatas` row already exists for the selected `slot_number`, that row is reused regardless of the Celeste save display name. This keeps bootstrap data attached to the same system user/save slot already used by the live tracker database.

The synthetic session stores the aggregate progress Celeste has available:

- deaths from `AreaModeStats.Deaths`
- time from `AreaModeStats.TimePlayed`, converted from .NET ticks to milliseconds
- strawberries from `AreaModeStats.TotalStrawberries` and collected `EntityID` count
- hearts from `AreaModeStats.HeartGem`
- dashes from DashCountMod when available, otherwise `AreaModeStats.BestDashes`
- jumps from DashCountMod when available, otherwise `0`

Session IDs are deterministic for `slot + chapter + side`, using the `initial-progress-` prefix. This prevents duplicate synthetic sessions if the same slot is accidentally imported again.

## Asset Indexing

After the database import succeeds, startup runs the existing installed mod asset indexer. The indexer can only copy assets for mods that are currently installed in the Celeste `Mods` folder, but it uses the newly imported `Chapters` rows as the worklist. This means previously played but currently uninstalled maps can have progress rows without indexed local assets.
