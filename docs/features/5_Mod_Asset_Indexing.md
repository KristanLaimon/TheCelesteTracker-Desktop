# Mod Asset Indexing

## Purpose

This feature gives The Celeste Tracker Desktop its own local asset database for installed Everest mods. The app extracts representative visual assets from the user's installed mods and stores private copies beside the desktop executable so the frontend can render richer UI without depending on live reads from the Celeste `Mods` folder.

Current supported assets:

- Chapter icon: used by the chapter select UI and now by the Recent Run History table.
- Endscreen image: copied and indexed for future UI use.

The extraction is intentionally read-only against the Celeste installation. Mod archives are inspected in place and are not decompressed into residual folders.

## User Requirements Covered

- Inspect actual installed mods under:

```text
C:\Program Files (x86)\Steam\steamapps\common\Celeste\Mods
```

- Mods are usually `.zip`; inspect inside those zips without leaving decompressed folders.
- Copy assets into the desktop app's own data folder, not symlink.
- Store asset file names in the tracker database, not absolute paths.
- Build paths in the Go backend when serving assets to the frontend.
- Update `index.astro` / `RecentRunsTable.svelte` surface so each chapter can show its icon, with a default icon fallback.

`index.astro` did not require a structural change because the Recent Run table is already mounted there:

```astro
<RecentRunsTable client:load />
```

The frontend change is contained in the Svelte component that renders that table.

## Related Existing Documentation

- [ModStructure.md](../everest_documentation/ModStructure.md)
- [MapMetadata.md](../everest_documentation/MapMetadata.md)
- [Database_TheCelesteDesktop.mermaid](../Database_TheCelesteDesktop.mermaid)
- [ModAssetExtraction.md](../ModAssetExtraction.md)

`ModAssetExtraction.md` is the lower-level implementation reference. This feature document explains the full app-facing feature, data flow, and changed files.

## Storage Layout

At runtime, assets are copied under the executable folder:

```text
<executable-folder>/data/assets/<mod-id>/
```

Example copied filenames:

```text
Glyph__BeefyUncleTorre_map_1__icon.png
Glyph__BeefyUncleTorre_map_1__endscreen.png
```

The `<mod-id>` folder comes from the first module `Name` found in the mod's `everest.yaml`. If no module name can be read, the zip or folder name is used as a fallback.

Path components are sanitized before writing files so SIDs such as `BeefyUncleTorre/map/1` become filesystem-safe filenames.

## Database Design

The existing schema already had nullable asset columns:

```text
Chapters.icon_img_path
Chapters.endscreen_img_path
```

The implementation writes only copied filenames into those fields. It does not write absolute paths.

Reasoning:

- The executable location can change between dev, build, and user install.
- The frontend should not know local filesystem paths.
- The backend is the right place to construct and validate local asset paths.

The database diagram documents these columns:

```text
Chapters {
    string sid PK
    int campaign_id FK
    string name
    string icon_img_path "Nullable"
    string endscreen_img_path "Nullable"
}
```

## Everest Asset Rules Used

### Chapter Icons

Chapter icons are declared in map metadata using the top-level `Icon` field.

Example from `Glyph.zip`:

```yaml
Icon: areas/glyph1
```

This resolves to the GUI atlas path:

```text
Graphics/Atlases/Gui/areas/glyph1.png
```

Custom chapter icons may also be stored in nested paths such as:

```text
Graphics/Atlases/Gui/areas/<author>/<campaign>/<icon>.png
```

Some mods do not declare `Icon` in metadata even though they show an icon in game. In that case, the extractor tries SID-based fallback paths. For example, this generic structure:

```text
Maps/author/campaign/map.bin
Maps/author/campaign/map.meta.yaml
Graphics/Atlases/Gui/areas/author/campaign/map_icon.png
```

Its `.meta.yaml` has no top-level `Icon`, so the fallback candidate:

```text
Graphics/Atlases/Gui/areas/<sid>_icon.png
```

resolves to:

```text
Graphics/Atlases/Gui/areas/author/campaign/map_icon.png
```

### Endscreen Images

Endscreens are declared under `CompleteScreen`.

Example:

```yaml
CompleteScreen:
    Atlas: "Endscreens/BeefyUncleTorre/Glyph"
    Layers:
        - Type: "layer"
          Images: ["1"]
```

This resolves to:

```text
Graphics/Atlases/Endscreens/BeefyUncleTorre/Glyph/1.png
```

If multiple images are present, the current implementation picks one representative image. The first resolvable image wins. If no inline image list is parsed, the extractor falls back to the first `.png` under the declared atlas folder.

## Real Mod Structures Observed

The implementation was shaped around actual installed mods, not just docs.

Observed examples:

- `Glyph.zip` contains `everest.yaml`, `Maps/**`, `Graphics/Atlases/Gui/areas/**`, and map metadata with `Icon` and `CompleteScreen`.
- `StrawberryJam2021.zip` contains map content and many GUI area icons.
- `StrawberryJam2021Assets.zip` contains companion endscreen assets under `Graphics/Atlases/Endscreens/**`.

Important design consequence:

Some mods split maps and assets across multiple installed zips. The extractor therefore builds a global in-memory content index across all installed mod zips and directory mods. It first tries to resolve assets in the same mod source as the map metadata, then falls back to the global content index.

## Backend Implementation

Main file:

```text
src/mod_assets.go
```

Public backend functions:

```go
func Asset_IndexInstalledMods() (ModAssetIndexResult, error)
func GetExecutableDataDir() (string, error)
func GetIndexedAssetAsBase64(fileName string) (string, error)
```

Wails-facing methods were added in:

```text
app.go
```

```go
func (a *App) GetIndexedAssetAsBase64(fileName string) (string, error)
func (a *App) IndexModAssets() (src.ModAssetIndexResult, error)
```

Startup now calls:

```go
result, err := src.Asset_IndexInstalledMods()
```

This means assets are indexed when the desktop app starts. `IndexModAssets` also exists as a callable method for manual refresh later.

## Backend Scan Flow

1. Resolve Celeste Mods folder with existing `GetCelesteModsFolder`.
2. Open each installed `.zip` with Go's `archive/zip`.
3. Read directory mods in place with `filepath.WalkDir`.
4. Build per-mod source indexes of normalized archive paths.
5. Build a global asset index across all mod sources.
6. For each `Maps/**/*.bin`, derive the default Everest map SID.
7. Read sibling `Maps/**/*.meta.yaml` when available.
8. Parse:
   - top-level `Icon`
   - `CompleteScreen.Atlas`
   - inline `CompleteScreen` image lists
9. Resolve icon and endscreen PNGs.
   - Explicit `Icon` metadata is tried first.
   - If `Icon` is missing, SID-based icon candidates are tried.
10. Copy selected PNGs into `<executable-folder>/data/assets/<mod-id>/`.
11. Update matching `Chapters` rows with copied filenames.

## Chapter SID Matching

Everest default SID:

```text
Maps/BeefyUncleTorre/map/1.bin -> BeefyUncleTorre/map/1
```

The local tracker database can prefix chapter SIDs with an area/save number:

```text
5:BeefyUncleTorre/map/1
```

The updater matches both:

```sql
WHERE sid = ? OR sid LIKE ?
```

with:

```text
sid
%:<sid>
```

B-side and C-side map filenames are canonicalized back to the base chapter SID:

```text
Maps/Author/Campaign/Map-B.bin -> Author/Campaign/Map
Maps/Author/Campaign/Map-C.bin -> Author/Campaign/Map
```

## Frontend Data Flow

The recent runs query now returns:

```go
ChapterSID  string `db:"chapter_sid"`
IconImgPath string `db:"icon_img_path"`
```

Implemented in:

```text
src/frontend_index.go
```

The SQL selects:

```sql
c.sid as chapter_sid,
coalesce(c.icon_img_path, '') as icon_img_path
```

The Wails generated frontend bindings were manually updated:

```text
frontend/wailsjs/go/models.ts
frontend/wailsjs/go/main/App.js
frontend/wailsjs/go/main/App.d.ts
```

If Wails bindings are regenerated later, these manual edits should be replaced by generated output.

## RecentRunsTable UI Behavior

Updated file:

```text
frontend/src/components/index/RecentRunsTable.svelte
```

New behavior:

1. Fetch recent runs as before.
2. Collect unique `IconImgPath` values.
3. Call backend `GetIndexedAssetAsBase64(fileName)` for each missing icon.
4. Cache loaded base64 data URLs in component state.
5. Render icons in this fallback order:
   - Indexed mod icon from `Chapters.icon_img_path`
   - Built-in vanilla icon from `Assets_Vanilla_ChapterIcon`
   - Built-in default modded icon: `level_logo_moddedleveldefault.png`

The default modded icon prevents blank icon cells when a mod has no indexed icon or the asset cannot be loaded.

## Security And Path Safety

`GetIndexedAssetAsBase64` accepts only a filename, not a path.

It rejects values containing:

```text
/
\
```

Then it searches under:

```text
<executable-folder>/data/assets
```

This prevents frontend callers from directly requesting arbitrary filesystem paths through this feature.

## Files Changed

Backend:

```text
app.go
src/mod_assets.go
src/frontend_index.go
```

Frontend:

```text
frontend/src/components/index/RecentRunsTable.svelte
frontend/wailsjs/go/models.ts
frontend/wailsjs/go/main/App.js
frontend/wailsjs/go/main/App.d.ts
```

Documentation:

```text
documentation/ModAssetExtraction.md
documentation/features/5_Mod_Asset_Indexing.md
```

## Verification Performed

Go:

```text
go test ./...
```

Result:

```text
PASS
```

Frontend diagnostics:

```text
svelte-check
```

Result:

```text
0 errors
3 warnings
```

The warnings were pre-existing and unrelated to this feature:

- `CollectionDetail.svelte`: non-interactive `h1` with interactive role.
- `CollectionModal.svelte`: two Svelte state initial-value warnings.

Frontend build:

```text
bun run build
```

Result:

```text
PASS
```

## Known Limitations

### YAML Parsing Is Conservative

The current metadata parser uses targeted text parsing instead of a full YAML parser.

It supports the observed common patterns:

```yaml
Icon: areas/glyph1
CompleteScreen:
    Atlas: "Endscreens/..."
    Layers:
        - Type: "layer"
          Images: ["1"]
```

It may miss more complex YAML structures, especially multiline non-inline image lists.

Future improvement:

- Add a YAML dependency and parse `.meta.yaml` structurally.

### Side-Specific Icons

If A/B/C side metadata defines different icons for the same chapter, the current implementation updates the same chapter row and whichever side is processed last can overwrite the value.

Open decision:

- Should A-side always win?
- Should side-specific icons be modeled separately in `ChapterSides` instead?

### Everest Load Order

When multiple installed mods provide the same texture path, the scanner currently resolves:

1. Same mod source as the map metadata.
2. First matching asset in the global index.

This is not a complete Everest load-order implementation.

Future improvement:

- Read Everest mod load order or Olympus metadata if available.
- Resolve overrides according to actual Everest behavior.

### Endscreen Representative Image

The current endscreen selection chooses the first resolvable image from metadata, or the first PNG in the atlas folder as fallback.

This can choose a small overlay layer instead of the best-looking representative image.

Future improvement:

- Prefer the largest PNG dimensions or byte size.
- Optionally composite simple endscreen layers into one preview image.

### Asset Refresh Strategy

Indexing currently runs on app startup and can be called manually through `IndexModAssets`.

Future improvement:

- Add a frontend refresh button.
- Track source zip modification times.
- Re-index only changed mods.

## Future UI Work

The backend already indexes `endscreen_img_path`, but the current UI only uses chapter icons in Recent Run History.

Potential next surfaces:

- Campaign cards.
- Chapter detail pages.
- Collection views.
- Run history hover preview.
- Chapter completion or personal-best panels.

## Strawberry Jam UI Exception

The extractor must stay generic and should not add one-off branches for individual normal mods. The accepted exception is Strawberry Jam because it is a major lobby-based collaboration with a distinct top-level workflow.

The index page includes a dedicated Strawberry Jam navigation card:

```text
frontend/src/pages/index.astro
```

It links to:

```text
/strawberry-jam
```

The route is implemented by:

```text
frontend/src/pages/strawberry-jam/index.astro
frontend/src/components/strawberry-jam/StrawberryJamOverview.svelte
```

This UI filters campaigns whose internal campaign ID starts with:

```text
StrawberryJam2021/
```

That special-casing belongs in the UI layer only. Asset extraction remains based on generic Everest file and metadata rules.

Strawberry Jam also has one extractor-level exception for map icons because its lobby UI uses sticker assets as map badges. The mappings are not stored in the individual map `.meta.yaml` files. They are stored in the lobby metadata:

```text
Maps/StrawberryJam2021/0-Lobbies/*.meta.yaml
```

Each sticker entry maps a sticker image to one or more completed maps:

```yaml
Stickers:
  - Path: SJ2021/1-Beginner/Asterisk
    FinishedMaps:
    - StrawberryJam2021/1-Beginner/asteriskblue
```

The sticker image itself can be in the companion asset zip:

```text
StrawberryJam2021Assets.zip/Graphics/Atlases/Stickers/SJ2021/<tier>/<sticker>.png
```

The extractor resolves that as:

```text
Graphics/Atlases/Stickers/<Path>.png
```

Lobbies and gyms use the main Strawberry Jam GUI area icons instead:

```text
Graphics/Atlases/Gui/areas/SJ2021/lobby/<chapter>.png
Graphics/Atlases/Gui/areas/SJ2021/gym/<chapter>.png
```

If no sticker exists for a Strawberry Jam map, the extractor falls back to checkpoint artwork:

```text
Graphics/Atlases/Checkpoints/StrawberryJam2021/<tier>/<map>/A/Start.png
Graphics/Atlases/Checkpoints/StrawberryJam2021/<tier>/<map>/A/start.png
```

If neither start filename exists, the first `.png` under the A-side checkpoint folder is used.

## Notes For Future Agents

- Do not extract mod zips into the Celeste `Mods` folder.
- Keep writes inside the app's own `data/assets` folder.
- Keep DB values as filenames unless the schema is intentionally changed.
- Prefer backend asset serving over exposing filesystem paths to the frontend.
- If Wails bindings are regenerated, check that `ModAssetIndexResult`, `RecentRun.ChapterSID`, `RecentRun.IconImgPath`, `GetIndexedAssetAsBase64`, and `IndexModAssets` are preserved.
- If adding YAML dependency, update `go.mod`, rerun `go test ./...`, and retest actual installed mods such as `Glyph.zip` and `StrawberryJam2021*.zip`.
