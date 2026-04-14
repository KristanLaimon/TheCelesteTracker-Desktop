# Data Model: Progress Sync & Stats CRUD

## Entities

### SaveData
Represents a Celeste save slot.
- `id`: Unique identifier (int)
- `user_id`: Link to `User` entity
- `slot_number`: 0, 1, or 2
- `file_name`: String display name
- `last_played`: ISO8601 timestamp (auto-updated)

### Campaign
Represents a collection of levels (e.g., "Celeste", mod name).
- `id`: Unique identifier (int)
- `name`: Display name
- `is_mod`: Boolean (true for lobbies/mods)
- `parent_campaign_id`: (Self-reference) used for nesting lobby maps (Principle VI)

### Chapter
Individual Celeste level.
- `id`: Unique identifier (int)
- `campaign_id`: Foreign key (Campaign)
- `sid`: Unique SID from Everest (e.g., `Celeste/1-ForsakenCity`)
- `name`: Localized name
- `mode`: "Normal", "BSide", "CSide"
- `has_golden`: Boolean (User Story 4 reward)

### Run
A single attempt at a chapter.
- `id`: Unique identifier (int)
- `chapter_id`: Foreign key (Chapter)
- `save_id`: Foreign key (SaveData)
- `deaths`: Count of deaths in this attempt
- `dashes`: Best-effort count (Principle V)
- `completion_time`: ISO8601 or null if ongoing
- `is_golden`: Boolean (User Story 4)

### RoomDeath
Tracks consistency within a run.
- `id`: Unique identifier (int)
- `run_id`: Foreign key (Run)
- `room_name`: SID of the room
- `deaths`: Count of deaths in this room for this run

## State Transitions
- **Idle**: App scanning for WebSocket (FR-001).
- **Syncing**: `DatabaseLocation` received; background fetch active (FR-004, FR-007).
- **Tracking**: `LevelStart` received; live run in progress (User Story 2).
- **Completed**: `AreaComplete` received; run persisted (FR-010).
