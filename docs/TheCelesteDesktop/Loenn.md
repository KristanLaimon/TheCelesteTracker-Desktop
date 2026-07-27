# Lönn internals relevant to this project's `.bin` map rendering

This is not a tour of Lönn (the current community Celeste map editor, a LÖVE2D/Lua
app cloned locally at `./loenn` for reference). It only covers what
`dependencies/Go_CelesteMapsBinParser` needs to render real tile/decal pixels
from a `.bin` map file — the tileset autotiling rules, the packed sprite atlas
format, and the decal texture-path convention. See
`docs/TheCelesteDesktop/CelesteMapBin_Format.md` for the `.bin` container
format itself (room bounds, Type 7 RLE tile-id grids, entities) — this doc
picks up where that one stops: turning a tile-id grid into real pixels.

## Tileset XML (autotiling rules)

Loaded from a Celeste install's `Content/Graphics/ForegroundTiles.xml` /
`BackgroundTiles.xml` (`loenn/src/celeste_render.lua:25-29`, via
`autotiler.loadTilesetXML`, `loenn/src/autotiler.lua:317`). Schema:

```xml
<Data>
  <Tileset id="1" path="dirt" copy="" ignores="">
    <set mask="000-0x0-000" tiles="0,0"/>
    <set mask="center" tiles="1,1;1,2"/>
    <set mask="padding" tiles="2,2"/>
  </Tileset>
</Data>
```

- `id`: single character matching the tile-id char in the `.bin`'s Type 7 RLE
  solids/bg grid (e.g. `'1'`, `'3'`, `'g'`).
- `path`: tileset name. The actual pixels live in the Gameplay atlas under the
  key `tilesets/<path>` (see below).
- `copy`: inherit another tileset's `<set>` rules (this tileset's own rules
  still win — first-match-wins per tile, see below).
- `ignores`: comma-separated tile-ids to treat as "air" when checking
  neighbors (lets e.g. a see-through tile not force a solid edge tile next to
  it).
- `<set mask="..." tiles="col,row;col,row;...">`: one autotiling rule.
  - `mask` is either a literal `"padding"` / `"center"` (fallback quads, see
    below), or a 3-row, 3-char-per-row string joined by `-`
    (`"000-0x0-000"`): `1` = neighbor must be filled, `0` = neighbor must be
    air, `x` = wildcard (matches either). **The center cell (row 1, col 1,
    index 4) is never actually checked** — a tile only ever autotiles against
    itself, so whatever character sits there is irrelevant
    (`loenn/src/autotiler.lua:107-141`, `maskToBitmask`/`getAdjacencyBitmask`
    both skip index 5 when building the 8-bit neighbor bitmask).
  - `tiles="col,row;col,row"`: one or more 8px-cell quad positions within the
    tileset's atlas image. Multiple entries are random variants for visual
    variety, not different rules.
  - Rules are checked in document order; **first match wins**
    (`loenn/src/autotiler.lua:157-165`, `getMaskQuadsFromTiles`).
- **"Filled" neighbor check is not "same tile id"** — it's "any non-air,
  non-ignored tile" (`loenn/src/autotiler.lua:40-46`, `autotiler.checkTile`):
  a neighbor counts as filled if it isn't air and isn't in this tileset's
  `ignores` list, regardless of its own tile-id. This is the standard
  autotiling notion of "solid vs. open", not tile-id equality — easy to get
  backwards when porting.
- `padding`/`center` sets are fallback quads when no numbered mask rule
  matches: `center` is used when the tile is fully surrounded (no adjacent
  air on any side), `padding` otherwise (`loenn/src/autotiler.lua:71-105`,
  `checkPadding`/`getPaddingOrCenterQuad`). Lönn's real `checkPadding` looks
  2 cells out in each cardinal direction (to support wide multi-tile padding
  pieces); this project's Go port only checks 1 cell out — a known,
  documented simplification (`ponytail:` comment in
  `pkg/mapbin/tileset_xml.go`).

## Gameplay atlas (`.meta` + `.data`)

Both tileset pixels (`tilesets/<path>`) and decal pixels
(`decals/<path>`) live in one packed sprite sheet:
`Content/Graphics/Atlases/Gameplay.meta` plus one or more `Gameplay<N>.data`
pixel files, loaded via `spriteLoader.loadSpriteAtlas`
(`loenn/src/sprite_loader.lua:209-296`).

**`.meta` binary layout** (little-endian, strings are .NET
`BinaryReader.ReadString` format — a 7-bit-encoded length prefix followed by
that many UTF8 bytes):

1. `int32` version (unused)
2. string checksum (unused)
3. `int32` unused header field
4. `int16` data-file count, then per data file:
   - string data file name (no extension — actual pixels are `<name>.data`
     next to the `.meta`)
   - `int16` sprite count, then per sprite:
     - string path (backslashes normalized to `/`; this is the atlas lookup
       key, e.g. `tilesets/dirt` or `decals/1-forsakencity/introcliffsidegrass0`)
     - 8x `int16`: `x, y, width, height, offsetX, offsetY, realWidth, realHeight`
       — `x,y,width,height` is the sprite's quad within its `.data` image;
       `realWidth`/`realHeight` is the sprite's full logical size (relevant
       for trimmed sprites, not used by this project's MVP renderer).

**`.data` pixel format**: `int32` width, `int32` height, `bool` hasAlpha (1
byte), then a run-length-encoded stream of premultiplied-alpha pixels in
row-major order (a run can span a row boundary) — `loenn/src/sprite_loader.lua:15-66`:

- `byte` repeat count (number of consecutive pixels with the following color)
- if `hasAlpha`: `byte` alpha; if alpha > 0, 3 more bytes in **b, g, r**
  order (premultiplied); if alpha == 0, the pixel is fully transparent (rgb
  bytes are *not* present in the stream for that run)
- if not `hasAlpha`: 3 bytes in **b, g, r** order, alpha implicitly 255

Go's `image.RGBA`/`color.RGBA` is also alpha-premultiplied, so the file's
premultiplied bytes can be copied straight into a `color.RGBA{R, G, B, A}`
with no math — Lönn only un-premultiplies because LÖVE2D's `ImageData:setPixel`
expects straight alpha. Getting the b/g/r byte order backwards (into R,G,B) is
the easy mistake here.

## Decal texture path resolution

A decal's raw `.bin` `texture` attribute (e.g.
`"1-forsakencity/introcliffsidegrass0"`) does **not** include a `decals/`
prefix — see `docs/TheCelesteDesktop/Ahorn.md` for where this is confirmed
explicitly (Lönn's own decal-loading code takes the string as-is and lets the
atlas lookup key already be `decals/...` from the `.meta`, without showing the
prefixing step as clearly). Always prepend `"decals/"` before the atlas
lookup.

## Render depth order

`loenn/src/celeste_render.lua:770-819` (`depthBatchingFunctions`): background
tiles, then background decals, then entities, then foreground tiles, then
foreground decals, then triggers — sorted by depth within each bucket. This
project's Go renderer (`pkg/mapbin/map_renderer.go`) follows this order with
one deliberate deviation: entity markers are drawn *before* the foreground
(`solids`) tile layer, not after, to avoid changing the existing flat-color
fallback rendering's layering (which predates real-asset support and is
covered by an existing pixel-dimension regression test). This only matters
visually for foreground tiles that are meant to overlap entities from the
front, which is rare.

## Stylegrounds — out of scope

Parallax backgrounds (`loenn/src/parallax.lua`) are simple texture + scroll
offset, but several effects (`loenn/src/effects/*.lua` — `dream_stars.lua`,
`black_hole.lua`, etc.) are bespoke procedural renderers, not texture blits.
Not implemented in this project; the `.bin`'s `Style` element tree is parsed
structurally only.
