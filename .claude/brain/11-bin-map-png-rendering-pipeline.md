# 11. `.bin` Map → PNG Rendering Pipeline (Phase 1 Blueprint MVP)

## Summary
Phase 1 implements the full `.bin` → PNG map rendering pipeline in Go and TypeScript without external image dependencies or atlas decoding overhead.

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
   - Go CLI subcommand: `zip export-map-images --mod <path> --map <sid> --out <dir>`
   - TypeScript wrapper: `Zip_Go.exportMapImages(opts: { modPath: string; mapSid: string; outputDir: string }): Promise<ExportMapImagesResult>`
