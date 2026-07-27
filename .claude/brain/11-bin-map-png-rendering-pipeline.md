# 11. `.bin` Map → PNG Rendering Pipeline

## Summary
`export-map` renders `.bin` maps to PNGs. Two modes: `--grid-only` (flat-color rects per tile-type/entity-kind, no external dependencies) and real-asset (actual tile/decal pixels, requires a Celeste install via `--celeste-dir`), with automatic fallback to grid rendering if real assets don't resolve. See `docs/TheCelesteDesktop/Loenn.md` and `docs/TheCelesteDesktop/Ahorn.md` for the tileset XML/atlas/decal format internals the real-asset path depends on — this file stays process/gotcha notes only.

## Key Learnings & Architecture Details
1. **Type 7 RLE String Decoding**:
   - Attribute type `7` in BinaryPacker stores a 2-byte (`uint16` LE) byte count header followed by `(count uint8, char uint8)` pairs.
   - Decompressing these byte pairs produces tile character lines separated by `\n`.
   - Grid dimensions for room `width` x `height` (px) are `(width / 8)` columns by `(height / 8)` rows.

2. **Entity Classification**:
   - Entities under `level -> entities` are bucketed into 4 marker kinds:
     - `spawn`: `player` or name matching `(?i)(player|spawn)`
     - `collectible`: classified via `isCollectibleEntity` matching strawberries, golden/moon berries, hearts, silver/speed/rainbow/platinum berries
     - `hazard`: spike/spring/spinner/lightning patterns
     - `generic`: all remaining helper entities

3. **Composite Bounding Math**:
   - Full map canvas dimensions: `(maxX - minX)` by `(maxY - minY)` across all room bounding boxes (`x`, `y`, `width`, `height`).
   - Each room image is composite-drawn onto the full map canvas at offset `(room.X - minX, room.Y - minY)`.

4. **CLI & TS Options Object API**:
   - Go CLI subcommand: `zip export-map --mod <path> --map <sid> --out <dir> [--grid-only] [--celeste-dir <path>]`
   - TypeScript wrapper: `Zip_Go.exportMap(opts: { modPath: string; mapSid: string; outputDir: string; gridOnly?: boolean; celesteDir?: string }): Promise<ExportMapImagesResult>`

5. **Real-asset rendering gotchas** (see `docs/TheCelesteDesktop/Loenn.md` for the full spec):
   - Autotiling "filled neighbor" means "any non-air, non-ignored tile", **not** "same tile id" — easy to get backwards.
   - Center cell (index 4) of a 3x3 mask is never checked; a tile always autotiles against itself.
   - `.data` atlas pixel bytes are already alpha-premultiplied, same as Go's `image.RGBA` — copy straight across, no unpremultiply math needed (unlike Lönn/LÖVE2D, which does divide because `ImageData:setPixel` wants straight alpha).
   - Decal `.bin` texture strings never include the `decals/` prefix; always prepend it before the atlas lookup (confirmed via `Ahorn/src/decals.jl`, see `docs/TheCelesteDesktop/Ahorn.md`).
   - `--grid-only` and the automatic real-asset-unavailable fallback must stay byte-for-byte the same rendering path (no bg-tile/decal drawing in that path) — that's what keeps the existing dimension-only regression test meaningful across both modes.
