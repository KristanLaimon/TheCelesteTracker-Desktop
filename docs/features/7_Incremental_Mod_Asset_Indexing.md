# Incremental Mod Asset Indexing

## Purpose

The mod asset indexer should not recopy every asset on every startup. It should only extract assets for chapters that are new to the tracker database or whose copied asset file is missing.

This behavior also handles first startup naturally:

- No manifest exists yet.
- The app has no record of any previously attempted chapter.
- Every tracked chapter in the database is queued once.

There is no special "first startup" branch. The empty manifest drives the initial full indexing pass.

## Manifest

The indexer stores a manifest beside copied assets:

```text
<executable-folder>/data/assets/asset_index_manifest.json
```

Shape:

```json
{
  "attemptedChapters": {
    "StrawberryJam2021/2-Intermediate/Liero": true,
    "StrawberryJam2021/2-Intermediate/GlowWoomii": true
  }
}
```

The keys are canonical chapter SIDs without tracker DB numeric prefixes.

Example:

```text
7:StrawberryJam2021/2-Intermediate/Liero
```

is stored as:

```text
StrawberryJam2021/2-Intermediate/Liero
```

## Worklist Rules

On startup, the backend queries all rows from `Chapters`:

```sql
SELECT
    sid,
    COALESCE(icon_img_path, '') as icon_img_path,
    COALESCE(endscreen_img_path, '') as endscreen_img_path
FROM Chapters
```

A chapter is queued for extraction when:

- Its canonical SID is not present in `asset_index_manifest.json`.
- Or one of its stored copied asset filenames points to a file that no longer exists.

If no chapters are queued, the indexer returns early and does not scan/open all mod zips.

## Extraction Scope

When chapters are queued, the scanner still builds the mod content index so cross-zip assets can resolve. But it only attempts extraction for map SIDs in the worklist.

This means:

- Existing chapters already attempted are skipped.
- Newly played chapters get indexed.
- Missing copied files are repaired.
- First run indexes all tracked chapters because none are attempted yet.

## Result Counters

`ModAssetIndexResult` now includes:

```go
ChaptersQueued    int
ChaptersAttempted int
ChaptersSkipped   int
```

These are exposed through Wails bindings for diagnostics.

## Backend Files

Main implementation:

```text
src/mod_assets.go
```

Key functions:

```go
readModAssetIndexManifest
writeModAssetIndexManifest
getChapterAssetWorklist
indexedAssetFileMissing
stripChapterSIDPrefix
```

## Frontend Bindings

The generated model type was updated:

```text
frontend/wailsjs/go/models.ts
```

`ModAssetIndexResult` includes:

```ts
chaptersQueued: number;
chaptersAttempted: number;
chaptersSkipped: number;
```

## Important Behavior

The indexer only stores filenames in SQLite:

```text
Chapters.icon_img_path
Chapters.endscreen_img_path
```

It does not store absolute paths.

Copied assets remain under:

```text
<executable-folder>/data/assets/<mod-id>/
```

## Notes For Future Agents

- Do not add a separate `if first startup` branch.
- Keep first-run behavior derived from an empty manifest.
- Keep extraction scoped to the worklist.
- If a future change needs to reindex all assets, delete `data/assets/asset_index_manifest.json` or add an explicit version field to invalidate old manifests.
- If mod update detection is added later, prefer adding source signatures to the manifest rather than blindly reprocessing every startup.
- Do not extract archives into the Celeste `Mods` folder.
