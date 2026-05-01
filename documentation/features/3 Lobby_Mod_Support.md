# Feature Specification: Lobby Mod Support (Lobby SDK & Collaborations)

## 1. Overview
Full support for large-scale Celeste collaborations (e.g., Strawberry Jam, Spring Collab). These mods use "Lobbies" to group multiple campaigns (tiers) together. This system automates the grouping, asset extraction, and hierarchical display of these complex mod structures.

## 2. Updated Data Hierarchy
1. **Lobby**: The "Parent" mod (e.g., "StrawberryJam2023"). Groups multiple tiers.
2. **Campaign**: A specific tier or sub-group (e.g., "1-Beginner").
3. **Chapter**: Individual levels within that tier.

**Database Relationship**:
- `Lobbies` table tracks parent mods.
- `Campaigns` table now includes a `lobby_id` (nullable).
- If `lobby_id` is NULL, the campaign is treated as a standalone "Individual Campaign".

## 3. Lobby Discovery & Grouping (Rust Backend)

### A. Prefix-Based Grouping Heuristic
The system identifies lobbies by analyzing the `campaign_name_id` provided by Everest/CollabUtils2:
- **Pattern**: `[LobbyName]/[CampaignName]` (e.g., `StrawberryJam2023/1-Beginner`).
- **Action**: Split by `/`. The first part becomes the **Lobby**, the second part the **Campaign**.
- **Sync**: Logic in `logic/lobbies.rs` automatically creates Lobby records and links existing campaigns during save-data scans.

### B. Asset Extraction (Lobby SDK)
The scanner in `logic/assets.rs` uses specialized heuristics to find visual assets for Lobbies and Tiers:

- **Lobby Icons**:
  1. `Graphics/Atlases/LobbyIcons/[LobbyName].png`
  2. `Graphics/Atlases/Gui/lobbies/[LobbyName].png`
- **Tier Banners**: 
  1. Searches for tier names within the mod's Endscreens (e.g., "Beginner", "Intermediate", "Advanced", "Expert", "Grandmaster").
  2. Map-based discovery: `Graphics/Atlases/Gui/areas/[CampaignName].png`.

## 4. UI Implementation (Svelte 5)

### A. Hierarchical Table (`CollectionTable.svelte`)
The table view now uses a nested grouping strategy:
- **Lobby Row**: A full-width header row displaying the Lobby Icon and Name.
- **Campaign Sub-Header**: Indented or styled row for the specific tier.
- **Chapter Rows**: The standard interactive stat rows, grouped under their parent Campaign.

### B. Visual Logic
- **Modded Icons**: If a Lobby has an icon extracted, it is displayed next to the Lobby header.
- **Empty State**: Campaigns without a parent lobby are grouped under a default "Individual Campaigns" section.

## 5. Technical Details

### A. Schema (Sea-ORM)
- **Table**: `Lobbies`
  - `id`: Primary Key (i64)
  - `save_data_id`: FK to `SaveDatas`
  - `name`: String (e.g., "StrawberryJam2023")
  - `icon_img_path`: String (Path to extracted PNG)

### B. Reactive State
- Uses Svelte 5 `$state` for the collection data.
- Aggregates (Time, Deaths, etc.) are calculated across the entire Lobby hierarchy using `$derived` runes.

## 6. Future Support: Exploration Tracking
- **Lobby Visit Manager**: Plan to integrate `LobbyRoomVisits` to track "rooms explored" vs "total rooms" in lobby maps, providing a percentage-based completion metric for the physical lobby space itself.
