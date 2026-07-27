# Ahorn internals relevant to old-map compatibility

Ahorn (a Julia map editor, predecessor to Lönn, cloned locally at `./Ahorn`
for reference) matters here for one reason: some mods' `.bin` maps were
authored years ago in Ahorn, before Lönn existed. This project's real-asset
renderer (see `docs/TheCelesteDesktop/Loenn.md`) is built against Lönn's
conventions — this doc records what was checked to confirm those conventions
also hold for old Ahorn-authored maps, and the one place they don't.

## What's confirmed identical to Lönn

- **Tile-id grid convention**: `Ahorn/src/auto_tiler.jl:306-315` — `' '`
  (space, out-of-bounds/unset) and `'0'` (explicit "Air") are both treated as
  "no tile", same as this project's and Lönn's assumption.
- **Tileset XML schema**: `Ahorn/src/auto_tiler.jl:104-180`
  (`loadTilesetXML`) parses the identical `Tileset id/path/copy/ignores` +
  `set mask/tiles` schema as Lönn, with bit-for-bit compatible mask matching
  (`getMaskFromString`, `Ahorn/src/auto_tiler.jl:23-36`). Ahorn and Lönn were
  written to be drop-in compatible with the same rule files — there is no
  older/alternate schema anywhere in the Ahorn source.
- **No legacy quirks flagged**: a repo-wide search of `Ahorn/src` for
  "legacy", "deprecated", "old format" turns up nothing related to the map
  format (one unrelated hit in an internal editor-tool API,
  `Ahorn/src/tools/selection.jl:825`).

## The one concrete divergence: decal texture prefix

`Ahorn/src/decals.jl:33,50` shows the raw `.bin` decal `texture` attribute
does **not** include a `"decals/"` prefix — Ahorn prepends it itself before
the atlas lookup:

```julia
texture = "decals/$(decal.texture)"
```

and reverses it the same way when writing decals back out
(`Ahorn/src/decals.jl:80-92`, strips the `"decals/"` prefix via `path[8:end]`).
This is the detail Lönn's own source leaves implicit — Ahorn's code is where
it's spelled out unambiguously. This project's decal renderer
(`drawDecal` in `pkg/mapbin/map_renderer.go`) always prepends `"decals/"`
unconditionally before calling `Atlas.GetSprite`, per this.

## What's unverifiable from this clone

Ahorn delegates the actual `.bin` binary parsing (the Type 7 RLE codec, the
BinaryPacker envelope) to an external Julia package, **Maple.jl**
(`Ahorn/Project.toml:14`), which is a separate dependency and is **not**
vendored inside this `./Ahorn` clone. So the raw byte-level `.bin` format
itself couldn't be independently cross-checked against Ahorn's source here —
only Ahorn's *consumption* of the already-parsed tile/decal data was
available to compare. Nothing in either editor's source suggests a divergent
on-disk format for old maps, but if a specific old map ever renders wrong,
cloning `CelestialCartographers/Maple.git` separately for a byte-level diff
is the next step, not assumed here.
