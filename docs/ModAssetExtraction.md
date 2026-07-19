# Mod Asset Extraction

This document describes how The Celeste Tracker Desktop indexes visual assets from installed Everest mods.

## Goal

The app keeps its own copy of selected mod assets under:

```text
<executable-folder>/data/assets/<mod-id>/
```

The database stores only copied file names in existing nullable columns:

```text
Chapters.icon_img_path
Chapters.endscreen_img_path
```

The Go backend constructs the full path when serving an asset to the frontend.

## Source Locations

Installed mods are scanned from the Celeste Mods folder:

```text
C:\Program Files (x86)\Steam\steamapps\common\Celeste\Mods
```

The scanner reads `.zip` files in place through Go's zip reader. It does not decompress archives into the Mods folder. Existing directory mods are read in place as directories, but the scanner does not write into them.

## Mod ID

The asset folder name is based on the first top-level module name found in `everest.yaml`:

```yaml
- Name: Glyph
```

If no module name can be read, the zip or folder name is used as a fallback.

## Chapter Matching

Maps are discovered from:

```text
Maps/**/*.bin
```

The default Everest SID is the path under `Maps/` without the `.bin` extension.

Examples:

```text
Maps/BeefyUncleTorre/map/1.bin -> BeefyUncleTorre/map/1
Maps/BeefyUncleTorre/map/6-B.bin -> BeefyUncleTorre/map/6
```

The current tracker database may prefix SIDs with a save or area number, for example:

```text
5:BeefyUncleTorre/map/1
```

The updater therefore matches either the exact SID or a prefixed `*:<sid>` database SID.

## Chapter Icons

Chapter icon metadata is read from the map's sibling `.meta.yaml` file:

```text
Maps/<sid>.meta.yaml
```

The scanner reads the top-level `Icon` value:

```yaml
Icon: areas/glyph1
```

That texture resolves to:

```text
Graphics/Atlases/Gui/areas/glyph1.png
```

The matching PNG is copied into the app asset database and the copied filename is written to `Chapters.icon_img_path`.

If the map metadata does not declare `Icon`, the scanner also tries common Everest chapter icon conventions based on the map SID:

```text
Graphics/Atlases/Gui/areas/<sid>_icon.png
Graphics/Atlases/Gui/areas/<sid>.png
```

For a map like `Maps/author/campaign/map.bin`, this finds:

```text
Graphics/Atlases/Gui/areas/author/campaign/map_icon.png
```

## Endscreen Images

Endscreen metadata is read from the map's `CompleteScreen` section:

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

If multiple images are listed, the first resolvable image is selected. If no inline image list is found, the scanner falls back to the first `.png` under the declared atlas folder.

Some large mods split maps and assets into companion zips. For example, map metadata can be in one zip while endscreen PNGs are in another installed asset zip. The scanner builds a global content index across installed mods so these references can still resolve without extracting archives.

## Current Behavior

- Assets are copied, not symlinked.
- Existing files with the same copied filename are overwritten.
- The Mods folder is only read.
- Indexing is incremental using `data/assets/asset_index_manifest.json`.
- On the first run, the manifest does not exist, so all tracked DB chapters are queued.
- On later runs, only new DB chapters or chapters whose copied asset file is missing are queued.
- The frontend loads indexed icons by filename through the backend.
- Recent run chapter icons fall back in this order:
  1. Indexed mod icon from `Chapters.icon_img_path`
  2. Built-in vanilla chapter icon
  3. Built-in generic modded-level icon

## Strawberry Jam Icons

Strawberry Jam is handled as a special collaboration case because its played maps use lobby stickers as their map icons, and those sticker images can live in the companion asset zip:

```text
StrawberryJam2021Assets.zip/Graphics/Atlases/Stickers/SJ2021/<tier>/<sticker>.png
```

The main Strawberry Jam zip stores the mapping from maps to stickers in lobby metadata under `Stickers`:

```yaml
Stickers:
  - Path: SJ2021/1-Beginner/Asterisk
    FinishedMaps:
    - StrawberryJam2021/1-Beginner/asteriskblue
```

The extractor reads these mappings from:

```text
Maps/StrawberryJam2021/0-Lobbies/*.meta.yaml
```

Then it resolves the sticker path under:

```text
Graphics/Atlases/Stickers/<Path>.png
```

Lobby and gym chapters use their dedicated GUI area icons:

```text
Graphics/Atlases/Gui/areas/SJ2021/lobby/<chapter>.png
Graphics/Atlases/Gui/areas/SJ2021/gym/<chapter>.png
```

If a Strawberry Jam map has no sticker mapping, the extractor falls back to the map checkpoint atlas, preferring:

```text
Graphics/Atlases/Checkpoints/StrawberryJam2021/<tier>/<map>/A/Start.png
Graphics/Atlases/Checkpoints/StrawberryJam2021/<tier>/<map>/A/start.png
```

If neither exact start filename exists, it uses the first `.png` under the A-side checkpoint folder. This covers maps that are represented by checkpoint art rather than lobby stickers.

## Edge Cases To Confirm

- When a chapter has separate A/B/C-side icons, the current implementation indexes the canonical chapter SID and may let a later side update the same chapter row. Should A-side always win?
- When multiple installed mods provide the same texture path, the scanner currently prefers the map's own zip/folder, then the first globally indexed matching path. Should this follow Everest load order instead?
- Some mods may use non-inline YAML lists for `CompleteScreen.Layers[].Images`; those are not fully parsed yet. Should the scanner use a full YAML parser dependency?
- Endscreen selection currently picks one PNG. If the selected layer is a small overlay, should the app prefer the largest PNG in the atlas instead?
