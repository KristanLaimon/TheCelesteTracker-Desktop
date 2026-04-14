# Implementation Plan: Live Run Stats & Real-time Updates

## Overview
Technical strategy for enabling real-time UI updates for Celeste runs and campaign stats. 
Fixes off-by-one death counter bug and implements dual death counter overlay.

## Architectural Changes
- **Backend (Rust)**:
  - Enhance `CelesteEvent` handling in `ws.rs` to better support session tracking.
  - Implement system wall-clock timestamping for run completion in `db.rs` or event handlers.
- **Frontend (Svelte 5)**:
  - Update `sync_store.svelte.ts` to manage active session state with higher granularity.
  - Update `celeste_logic.svelte.ts` to handle real-time stat increments for both individual runs and campaign aggregates.
  - Update `LiveTracker.svelte` to display dual death counters.

## Data Model Updates
- **RunSession (Frontend State)**:
  - Add `status: 'Active' | 'Completed' | 'Aborted'` to `Run` type in `entities.ts`.
  - Add `room_deaths: number` to active run state in `SyncStore`.
- **CampaignStats (Frontend Derived)**:
  - Use `$derived` in `SyncStore` to calculate live campaign totals by summing existing data + current active run stats.

## Backend Implementation
- **WebSocket Enhancement (`ws.rs`)**:
  - No major changes needed to raw event streaming as `ws.rs` already emits all `CelesteEvent` types.
- **Run Finalization**:
  - Ensure `MenuAction` (SAVE_AND_QUIT, etc.) and `AreaComplete` trigger database persistence of the current run with a system timestamp.
  - New Tauri command `finalize_run(run_data)` to be called from frontend when session ends.

## Frontend Implementation
- **State Management (`sync_store.svelte.ts`)**:
  - Refactor `handleEvent` to:
    - `LevelStart`: Create a new `currentRun` with status `Active`. Initialize `totalDeaths` and `roomDeaths` correctly.
    - `Death`: Increment `currentRun.deaths` and `currentRun.roomDeaths`.
    - `LevelInfo` (Room transition): Reset `currentRun.roomDeaths` to 0.
    - `MenuAction` / `AreaComplete`: Set `currentRun.status` to `Completed`/`Aborted`, set `completion_time` to current ISO string, and trigger database sync.
  - Fix off-by-one bug: Ensure `currentRun.deaths` is initialized to the starting `TotalDeaths` from `LevelStart` (if provided) or correctly synced on the first `Death` event.
- **UI Components**:
  - `LiveTracker.svelte`:
    - Add UI for `Total Deaths` (from `currentRun.deaths`) and `Room Deaths` (from `currentRun.roomDeaths`).
  - `CampaignList.svelte` / `CampaignView.svelte`:
    - Use `$derived` to show live-updated totals.
  - `RunList.svelte`:
    - Add logic to detect the active run by ID or status and apply a CSS class for static highlighting (background color).

## Integration Strategy
- **Event Flow**:
  1. Celeste -> WebSocket -> Tauri (`ws.rs`) -> `celeste-event` (Tauri Event).
  2. `celeste_logic.svelte.ts` updates `celesteState` for transient UI feedback (e.g., flashing).
  3. `sync_store.svelte.ts` updates `syncStore.currentRun` for data-driven views and eventual persistence.
- **Persistence**:
  - Use Tauri `invoke` to call Rust commands for saving the finalized run.

## Verification Plan
- **Automated Tests**:
  - **Rust**: Unit tests in `db.rs` for run persistence with timestamps.
  - **Svelte**: Vitest mocks for `CelesteEvent` to verify `SyncStore` state transitions (especially first death and room reset).
- **Manual Verification**:
  - Start Celeste, enter a level -> Verify new row appears with highlight.
  - Die once -> Verify Total Deaths is 1 and Room Deaths is 1.
  - Move to next room -> Verify Room Deaths resets to 0.
  - Die in new room -> Verify Total Deaths is 2 and Room Deaths is 1.
  - Exit to menu -> Verify highlight removed, run persists in list with completion time.
  - Check Campaign view during run -> Verify totals increment on every death.
