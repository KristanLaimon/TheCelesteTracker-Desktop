# Quickstart: Automated Progress Sync & Statistics CRUD

## Overview
This feature implements real-time sync with Celeste's Everest mod via WebSockets and manages a local SQLite database for historical statistics tracking.

## Local Setup
1. **Celeste**: Install [TheCelesteTracker Mod](https://github.com/KristanLaimon/TheCelesteTracker-Mod).
2. **Companion**: Launch the Tauri app.
3. **Sync**: Ensure the app detects the `DatabaseLocation` event on startup.

## Development Tasks
- **Backend (Rust)**:
  - Implement WebSocket listener in `src-tauri/src/ws.rs` (FR-001).
  - Define `Event` types in `src-tauri/src/events.rs` (FR-002, FR-005).
  - Create SQLite queries for `SaveData`, `Campaign`, `Chapter`, and `Run` (Principle IV).
- **Frontend (Svelte 5)**:
  - Create `lib/logic/sync_store.svelte.ts` using Runes (Principle III).
  - Implement real-time UI updates (User Story 2).
  - Add "Golden Chapter" visual badge (User Story 4).

## Testing
- `backend-only`: `cargo test` in `src-tauri/`.
- `frontend-only`: `npm run test` (or equivalent).
- `integration-tests`: Activate `integration-test` mode via `INTEGRATION_TEST=true` env var (Principle VI).
