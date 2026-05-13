# Strawberry Jam Map Icon Extraction

## Purpose

Strawberry Jam is a special case for map icons because many map badges shown in the lobby are not declared as normal chapter icons in individual map metadata. Instead, Strawberry Jam uses lobby sticker metadata and a companion asset zip.

This feature improves extraction so Recent Run History can show icons for played Strawberry Jam maps such as:

```text
Fifth Dimension
Honeyzip Inc.
Blueberry Bay
```

The implementation avoids hardcoding individual level names. It uses Strawberry Jam's own metadata mappings and folder conventions.

## Source Archives

Main mod:

```text
C:\Program Files (x86)\Steam\steamapps\common\Celeste\Mods\StrawberryJam2021.zip
```

Companion asset mod:

```text
C:\Program Files (x86)\Steam\steamapps\common\Celeste\Mods\StrawberryJam2021Assets.zip
```

The extractor reads both zips in place. It does not extract files into the Celeste `Mods` folder.

## Sticker Icon Source

Most normal Strawberry Jam maps use sticker images from:

```text
StrawberryJam2021Assets.zip/Graphics/Atlases/Stickers/SJ2021/<tier>/<sticker>.png
```

Example:

```text
Graphics/Atlases/Stickers/SJ2021/2-Intermediate/Liero.png
Graphics/Atlases/Stickers/SJ2021/2-Intermediate/Woomii.png
```

These correspond to maps such as:

```text
StrawberryJam2021/2-Intermediate/Liero      -> Fifth Dimension
StrawberryJam2021/2-Intermediate/GlowWoomii -> Honeyzip Inc.
```

The second example shows why filename guessing is not enough: the map SID is `GlowWoomii`, but the sticker file is `Woomii.png`.

## Mapping Source

The correct map-to-sticker mapping is stored in Strawberry Jam lobby metadata:

```text
Maps/StrawberryJam2021/0-Lobbies/*.meta.yaml
```

The metadata has `Stickers` entries:

```yaml
Stickers:
  - Path: SJ2021/1-Beginner/Asterisk
    FinishedMaps:
      - StrawberryJam2021/1-Beginner/asteriskblue
```

The extractor parses:

```text
Path
FinishedMaps
```

Then resolves:

```text
Graphics/Atlases/Stickers/<Path>.png
```

This is generic within Strawberry Jam. It does not hardcode specific map names.

## Lobby And Gym Icons

Strawberry Jam lobby chapters use GUI area icons from:

```text
Graphics/Atlases/Gui/areas/SJ2021/lobby/<chapter>.png
```

Gym chapters use:

```text
Graphics/Atlases/Gui/areas/SJ2021/gym/<chapter>.png
```

Examples:

```text
Graphics/Atlases/Gui/areas/SJ2021/lobby/1-Beginner.png
Graphics/Atlases/Gui/areas/SJ2021/gym/2-Intermediate.png
```

## Checkpoint Artwork Fallback

Some Strawberry Jam maps do not have a sticker mapping. Heartside maps are a common case. For example, `Blueberry Bay` is:

```text
StrawberryJam2021/1-Beginner/ZZ-HeartSide
```

The asset zip contains checkpoint artwork for these maps:

```text
Graphics/Atlases/Checkpoints/StrawberryJam2021/<tier>/<map>/A/*.png
```

The extractor falls back in this order:

```text
Graphics/Atlases/Checkpoints/StrawberryJam2021/<tier>/<map>/A/Start.png
Graphics/Atlases/Checkpoints/StrawberryJam2021/<tier>/<map>/A/start.png
first .png under Graphics/Atlases/Checkpoints/StrawberryJam2021/<tier>/<map>/A/
```

This keeps the rule generic and avoids level-name-specific code.

## Backend Changes

Main implementation:

```text
src/mod_assets.go
```

Added logic:

- `resolveStrawberryJamChapterIconAsset`
- `parseStrawberryJamStickerPaths`
- `parseStrawberryJamStickerPathsFromMeta`
- `resolveStrawberryJamCheckpointIconAsset`

The generic extractor calls Strawberry Jam resolution only after normal icon resolution fails:

1. Explicit `Icon` metadata.
2. Generic SID-derived icon paths.
3. Strawberry Jam lobby/gym/sticker/checkpoint rules.

This keeps normal mods on generic Everest rules.

## Asset Lookup Hardening

Some icons were already copied and stored in the DB but still could fail to render if the running app looked in a different data folder during development.

Backend asset lookup now checks candidate data folders:

```text
<executable-folder>/data
<current-working-directory>/data
<current-working-directory>/build/bin/data
```

Frontend still requests icons by filename only. The backend remains responsible for finding and serving the copied asset.

## Database Behavior

The database still stores only copied filenames:

```text
Chapters.icon_img_path
```

No absolute paths are stored.

Example copied filenames:

```text
StrawberryJam2021__StrawberryJam2021_2-Intermediate_Liero__icon.png
StrawberryJam2021__StrawberryJam2021_2-Intermediate_GlowWoomii__icon.png
StrawberryJam2021__StrawberryJam2021_1-Beginner_ZZ-HeartSide__icon.png
```

## Frontend Effect

Recent Run History already loads `IconImgPath` from the backend and resolves it with:

```text
GetIndexedAssetAsBase64(fileName)
```

Once indexing has run, played Strawberry Jam maps should show their extracted icons in:

```text
frontend/src/components/index/RecentRunsTable.svelte
```

No per-map frontend hardcoding is required.

## Verification

Commands run:

```text
go test ./...
bun run build
```

Expected result:

```text
PASS
```

## Notes For Future Agents

- Do not hardcode individual Strawberry Jam level names.
- Use `FinishedMaps` mappings from lobby metadata for sticker icons.
- Use GUI area paths for lobbies and gyms.
- Use checkpoint artwork as the generic fallback for Strawberry Jam maps without stickers.
- Keep copied assets in the app `data/assets/<mod-id>` database.
- Keep DB values as filenames only.
- Do not extract zip contents into the Celeste `Mods` folder.
