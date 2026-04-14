# Contracts: Automated Progress Sync & Statistics CRUD

## WebSocket Inbound (Everest -> Companion)
The app listens for JSON events from Everest.

### `DatabaseLocation`
- `Type`: "DatabaseLocation"
- `Path`: Full path to SQLite file
- `ModVersion`: Version string

### `LevelStart`
- `AreaSid`: Unique chapter identifier
- `Mode`: "Normal", "BSide", "CSide"

### `Death`
- `RoomName`: String ID of the room
- `TotalDeaths`: Cumulative count for the run

### `AreaComplete`
- `Stats`: Full results object (Golden, Deaths, Time)

## Tauri Commands (Frontend -> Backend)

### `fetch_all_stats`
- **Input**: None
- **Output**: JSON payload of all Campaigns, Chapters, and Runs.
- **Goal**: Full UI initialization (FR-004).

### `update_run`
- **Input**: `run_id` (int), `changes` (Object)
- **Output**: Success/Failure status.
- **Constraint**: Cannot update if `run_id` is the current active run (EC-001).

### `delete_run`
- **Input**: `run_id` (int)
- **Output**: Success/Failure status.
- **Constraint**: Cannot delete if `run_id` is the current active run (EC-001).

## App Configuration (`config.json`)
Stored next to the `.exe` (FR-013).
- `start_behavior`: "main-menu" | "last-session" | "specific"
- `theme`: "dark" | "light" | "custom-hex"
- `last_active_slot`: 0 | 1 | 2
