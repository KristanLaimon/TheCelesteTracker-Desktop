# Feature Specification: Mod Asset Management (Banners & Icons)

## 1. Overview
Automated system to extract, cache, and serve visual assets (Campaign Banners, Chapter Icons, and Checkpoint Previews) from Celeste mod files (`.zip`). Assets are stored locally in the app's `data/` directory to ensure high-performance UI and offline availability.

## 2. File System Architecture
Assets are stored in a `data/` directory relative to the executable (or app data path).

- `data/`
  - `banners/`: Campaign cover images.
    - Filename: `[campaign_id_hash].png`
  - `chaptericons/`: Chapter select icons.
    - Filename: `[chapter_sid_hash].png`
  - `checkpoints/`: In-game map screen previews.
    - Filename: `[chapter_sid_hash]_[checkpoint_index]_[side].png`

## 3. Extraction Logic (Rust Backend)

### A. Mod Identification & Metadata
- **everest.yaml**: Parse the root YAML file to extract `Name` and `Version`.
- Match the `Name` field against the database's `Campaign.id` or `Chapter.sid`.
- **SID Sanitization**: Use a SHA-256 hash or a URL-safe Base64 encoding of the Chapter SID to create file-safe names for the `data/` folder.

### B. Path Discovery (Internal ZIP Paths)
The system searches these paths (case-insensitive) within the `.zip`:

- **Campaign Banners**:
  1. `Graphics/Atlases/Endscreens/[Author]/[Name].png` (e.g., `.../Endscreens/BeefyUncleTorre/Glyph.png`)
  2. `Graphics/Atlases/Endscreens/[Name].png`
  3. Fallback: Search `Graphics/Atlases/Endscreens/` for any PNG.
- **Chapter Icons**:
  1. `Graphics/Atlases/Gui/areas/[Name].png`
  2. `Graphics/Atlases/Gui/campaign_banners/[Name].png`
  3. `Graphics/Atlases/Gui/chapters/[Name].png`
  4. Fallback: `Graphics/Atlases/Gui/[Name].png`
- **Checkpoint Previews**:
  1. `Graphics/Atlases/Checkpoints/[SID]/map/[Index]/[Side]/[Image].png` (e.g., `.../map/1/A/start.png`)

### C. Processing Pipeline
1. **Discovery**: Locate the mod `.zip` in `Celeste/Mods/`.
2. **Buffering**: Use the `zip` crate to stream only the required asset into memory.
3. **Persisting**: Write the buffer to the corresponding `data/` sub-folder using the sanitized hash name.
4. **DB Sync**:
   - `Campaigns.cover_img_path` = `data/banners/[hash].png`
   - `Chapters.icon_img_path` = `data/chaptericons/[hash].png`

## 4. UI Integration (Svelte 5)

### A. Asset Resolution
- Use Tauri's custom protocol (e.g., `asset://localhost/[path]`) to bypass CORS and serve local files.
- The `saveStore` or a dedicated `assetStore` should handle the mapping between DB paths and local URLs.

### B. Display Components
- **Banners**: Displayed in `CollectionDetail.svelte` header. Use `aspect-video` (16:9) with `object-cover`.
- **Icons**: Displayed in `CollectionTable.svelte`. Fixed `w-12 h-12` or `w-16 h-16`.
- **Fallbacks**:
  - If asset is missing, use default placeholder: `src/assets/level_logo_moddedleveldefault.png`.

## 5. Maintenance
- **Re-Scan**: Trigger when a new save file is detected or the mod version in `everest.yaml` changes.
- **Purge**: Delete assets from `data/` if the corresponding mod is no longer present in the `Celeste/Mods/` directory.
