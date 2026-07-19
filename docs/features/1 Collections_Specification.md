# Feature Specification: Collections (Campaign & Mod Manager)

## 1. Overview
Digital tracking for Celeste progress. Aggregates stats across custom tiers. CRUD interface for runs/reviews. Dynamic mod scanning.

## 2. Data Hierarchy
1. **Tier (Collection)**: Top level (e.g., "Personal TIER").
2. **Campaign (Mod)**: Group of levels (e.g., "Glyph").
3. **Chapter (Level)**: Granular stats (e.g., "Spring-Side").

## 3. UI Components (Svelte 5)

### A. Tier Summary Banner
- **Stats**: Total Time, Berries, Goldens, Hearts, Deaths, Dashes.
- **Counts**: Campaign/Chapter totals.

### B. Campaign Block
- **Asset**: Dynamic banner from local install (see `Mod_Asset_Management.md`).
- **Review**: Global campaign notes.

### C. Chapter Table (`CollectionTable.svelte`)
Interactive rows with Edit Mode.
- **Status**: `ActualState` dropdown.
- **Stats**: Berries (Numeric), Golden (Checkbox/Num), Time (H:M:S), Deaths, Dashes, Jumps.
- **Review**: Difficulty (1-10), Enjoyment (Slider), Notes (Textarea).

## 4. State & Logic

### A. `ActualState` Enum
`never_played`, `attempted`, `completed`, `full_clear`, `golden_completed`, `wingberry_completed`, `golden_and_wingberry`.

### B. Golden Attempt Display
- If `attemptType == "Golden Attempt"`:
  - `status == "Completed"` -> "Golden Failed".
  - `status == "Attempted"` -> "Golden Attempted".
  - Deaths -> Pulsing red marker (no count).

## 5. Technical Implementation

### A. Backend (Rust/Sea-ORM)
- **Aggregates**: SQL `SUM` for Tier-level stats.
- **CRUD**: `update_chapter_stats` tauri command.
- **Scanning**: Automatic `everest.yaml` parsing.

### B. Frontend (Svelte Runes)
- **Reactivity**: `$state` for row data. `$derived` for tier aggregates.
- **Persistence**: Optimistic UI updates. Revert on failure.

## 6. Asset Resolution
- Protocol: `asset://localhost/`
- Scanner: Locates `.zip` in `Celeste/Mods/`.
- Fallback: `src/assets/level_logo_moddedleveldefault.png`.
