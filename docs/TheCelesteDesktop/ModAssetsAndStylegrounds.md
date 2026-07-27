# Mod-provided assets + parallax stylegrounds (follow-up to `Loenn.md`/`Ahorn.md`)

Two follow-on gaps in `export-map`'s real-asset renderer, closed together:
a mod's own loose `Graphics/` files were never consulted (only the base
Celeste install), and the map-wide `Style` backdrop tree was parsed
structurally but never rendered. Both are wired into
`pkg/mapbin/exporter.go`'s `ExportMapImages`, active only when real-asset
rendering is (`--celeste-dir` set, `--grid-only` not set) - `--grid-only` and
the no-`--celeste-dir` fallback path are untouched by either.

## Mod-provided loose Graphics assets

Confirmed via `docs/Everest/ModStructure.md` ("Adding Graphics" / "File
Layout") and `docs/Everest/TexturePacks.md`: a mod overrides or adds any
vanilla texture by shipping a file at the same relative path, always under
`Graphics/Atlases/<AtlasName>/<key>.png`. This project only ever reads the
`Gameplay` atlas (the one tiles/decals/parallax bgs live in), so the relevant
mod path is always `Graphics/Atlases/Gameplay/<atlasPath>.png`, where
`<atlasPath>` is exactly the same key this renderer already looks up
(`tilesets/<path>`, `decals/<path>`, `bgs/<path>`).

- `pkg/mapbin/mod_overlay.go` - `modAssetResolver` reads a mod's loose files,
  whether the mod is an unpacked folder or a `.zip` (the same two shapes
  `getMapBinBytes` already handles). `newModAssetResolver(modPath)` returns
  `(nil, nil)` if `modPath` isn't a real dir/zip - no error, just "no overlay
  available", matching the rest of the pipeline's silent-fallback convention.
- `Atlas.SetModOverlay(fn)` / `atlas.go`'s `GetSprite`: the mod overlay is
  checked *before* the packed atlas, so a mod's own art always wins over
  vanilla for the same key. A mod PNG is treated as a standalone sprite (no
  `.meta.yaml` trim/offset support - `ponytail:` simplification, only matters
  for mods whose loose art relies on sub-pixel trim metadata).
- `LoadTilesetXMLBytes` + `MergeTilesetRules` (`tileset_xml.go`): if a mod
  ships its own `Graphics/ForegroundTiles.xml`/`BackgroundTiles.xml`, its
  rules are merged into the base rule set, winning on tile-id collision. This
  mapping isn't one of Everest's four formally-guaranteed content types (only
  `Graphics/Atlases/*.png`, `Maps/*.bin`, `Dialog/*.txt`, `Audio/*.bank` are
  documented as "supported out of the box" - `ModStructure.md`'s File Layout
  section), so it's kept best-effort: a missing or unparsable mod XML just
  means no merge, never a hard failure.

## Parallax stylegrounds

`Loenn.md` previously scoped out all stylegrounds because several backdrop
types (`dream_stars.lua`, `black_hole.lua`, ...) are bespoke procedural
renderers. Confirmed via `loenn/src/parallax.lua` that the plain `parallax`
backdrop - a single scrolling texture, the common case, and exactly the
`bgs/<author>/*.png` shape mods ship - is just a texture blit with
position/tiling/tint/alpha, no procedural logic. Only `parallax` elements are
now rendered; every other backdrop element name is still skipped exactly as
before.

`.bin` shape: a map-root `Style` element (sibling of the room tree, not
nested per-level) with `Foregrounds`/`Backgrounds` children, each holding one
element per backdrop - `parallax` for texture backdrops, an effect-specific
name otherwise.

- `pkg/mapbin/types.go` - `BackdropData` + `MapRenderData.Backdrops`
  (map-wide, not per-room). `scrollx`/`scrolly` and `blendmode` are parsed
  and dropped: scroll only matters with a moving camera, irrelevant to a
  static per-room screenshot, and additive blending is rare enough to treat
  as regular alpha-over (`ponytail:` on both).
- `pkg/mapbin/exporter.go` - `readFullElement` routes `Style/Foregrounds` and
  `Style/Backgrounds` children through new `"styleground-fg"`/
  `"styleground-bg"` container tags; only child elements literally named
  `parallax` become a `BackdropData`.
- `pkg/mapbin/map_renderer.go`:
  - `matchesRoomFilter(roomName, only, exclude)` - `only`/`exclude` are
    comma-separated glob patterns (`*` wildcard) against the room name,
    confirmed via `parallax.lua`'s `only = "*"`/`exclude = ""` defaults.
  - `drawParallaxLayer`/`drawParallaxTile` - tiles the resolved sprite across
    the room bounds from `(X, Y)` when `LoopX`/`LoopY`, honoring
    `FlipX`/`FlipY` and `Alpha`; texture tint (`color`) is skipped
    (`ponytail:` - rare in practice, most stylegrounds use `"FFFFFF"`).
  - Draw order matches `loenn/src/celeste_render.lua`'s bucket order:
    background parallax first (before bg tiles), foreground parallax last
    (after fg decals, before the room border).

Both features are additive only - `go test ./...` covers `modAssetResolver`
(folder + zip), `MergeTilesetRules`, `matchesRoomFilter`, and Style-tree
parsing (parallax kept, non-parallax effects dropped); manually verified
against the real Celeste install (`1-ForsakenCity`) that `--grid-only` output
is unchanged and real-asset rooms now render their scrolling background
texture instead of the flat room-background color.
