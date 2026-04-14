# Feature Specification: Live Run Stats & Real-time Updates

**Feature Branch**: `002-live-run-stats-update`  
**Created**: 2026-04-14  
**Status**: Draft  
**Input**: User description: "1. if im on run screen, i want to see updated in real time a new row, flashing if its the actual run, and when I win the level or quit, i want it to be there updated in real time without refreshing this page, also, always add completion time even though im going to menu, this date means the thay i finished that run independently if I finished the level or not 2. if im on campaign level i want to see the new run there updated when I finish the run, and all campaign stats (deaths, dashes) updated as well, the same way in run scree. 3. Current run screen (when entering into a level) should show 2 death counters, 1 for total deaths, (currently theres a bug that, starts on 0 on first death), and the current room counter,"

## Clarifications

### Session 2026-04-14
- Q: Persistence and style of active run visualization? → A: Static highlight (different background color) for active row.
- Q: Room death counter reset timing? → A: Reset to 0 immediately upon room entry.
- Q: Campaign stat update frequency? → A: Update on every event (Death, Dash, etc.).
- Q: Death counter bug fix logic? → A: Fix by ensuring UI state increments before/simultaneously with visual update.
- Q: Source for completion timestamp? → A: System wall-clock time (on event receipt).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-time Run History Updates (Priority: P1)

As a speedrunner, I want to see my current run appear in the run history table as soon as it starts, and update its death/dash/time stats in real-time. This allows me to track my progress without leaving the run screen or refreshing.

**Why this priority**: Core value of the "live tracker" experience. It ensures the UI stays in sync with the game state immediately.

**Independent Test**: Can be tested by starting a run in Celeste and observing a new row appearing and updating its counters in the Run History table without page refresh.

**Acceptance Scenarios**:

1. **Given** the player is on the Run History screen, **When** they enter a level in Celeste, **Then** a new row is appended to the table with a static highlight (different background color) to indicate it is the active run.
2. **Given** an active run row is visible, **When** the player dies in-game, **Then** the death count in that row increments immediately and the row briefly flashes to indicate an update.
3. **Given** the player finishes a level or returns to the menu, **When** the session ends, **Then** the row persists with its final stats and a "completion time" (end timestamp) derived from the system wall-clock.

---

### User Story 2 - Real-time Campaign Stat Aggregation (Priority: P2)

As a collector, I want to see the total stats for my entire campaign (total deaths, total dashes) update in real-time as I play different chapters.

**Why this priority**: Provides an overview of overall progress and effort across multiple maps.

**Independent Test**: Can be tested by viewing the Campaign screen while playing and observing the "Total Deaths" and "Total Dashes" counters increment as events are received.

**Acceptance Scenarios**:

1. **Given** the player is viewing a Campaign summary, **When** a `Death` event is received via WebSocket, **Then** the campaign's total death counter increments immediately.
2. **Given** a level is completed, **When** the `AreaComplete` event is received, **Then** the campaign's "Total Runs" and "Total Chapters" stats update without refresh.

---

### User Story 3 - Dual Death Counter Overlay (Priority: P1)

As a player in a challenging room, I want to see both my total deaths for the run and my current room deaths side-by-side so I can track both my overall consistency and specific room difficulty.

**Why this priority**: Essential for practice and run analysis. Fixes a bug where the total death counter starts at 0 on the first death.

**Independent Test**: Can be tested by opening the Live Tracker overlay while in a room and verifying two distinct counters that update correctly from the first death onwards.

**Acceptance Scenarios**:

1. **Given** the player is in a level, **When** the Live Tracker is visible, **Then** two counters are displayed: "Total Deaths" and "Room Deaths".
2. **Given** the first death of a run, **When** the player dies, **Then** the "Total Deaths" counter displays `1` immediately (not `0`).
3. **Given** the player moves to a new room, **When** the `LevelStart` (new room) event is received, **Then** the "Room Deaths" counter resets to `0` immediately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST append a new run record to the current view's state upon receiving `LevelStart`.
- **FR-002**: System MUST apply a static highlight (different background color) to the most recent run row while it is in progress.
- **FR-003**: System MUST update individual run stats (deaths, dashes, time) in the UI state immediately upon receiving *every* `Death` or `Dash` event.
- **FR-004**: System MUST fix the off-by-one/lazy-update bug in the death counter by ensuring UI state increments before/simultaneously with the visual update upon receiving the first `Death` event.
- **FR-005**: System MUST capture and display a "Completion Timestamp" for every run session derived from the system wall-clock time at event receipt, regardless of whether it ended via `AreaComplete` or `MenuAction` (quit).
- **FR-006**: System MUST update aggregated Campaign statistics (Total Deaths, Total Dashes) in real-time immediately upon receiving every WebSocket event.
- **FR-007**: System MUST display two distinct death counters in the Live Tracker view: `Total Deaths` and `Current Room Deaths`.

### Key Entities *(include if feature involves data)*

- **RunSession**: Represents a single level attempt. Attributes: start_time, end_time, total_deaths, room_deaths, total_dashes, status (Active, Completed, Aborted).
- **CampaignStats**: Aggregated data for a collection of levels. Attributes: total_deaths, total_runs, total_dashes.

### Technical Constraints

- **TC-001**: Feature MUST NOT require manual user input for data tracking (Principle I).
- **TC-002**: Core backend logic MUST be implemented in Rust (Principle II).
- **TC-003**: UI MUST use Svelte 5 Runes ($state, $derived, $effect) for state and minimize FPS impact (Principle III).
- **TC-004**: All feature data MUST remain local to the user's machine (Principle IV).
- **TC-005**: All core logic MUST be covered by separate Rust and Svelte unit tests (Quality Standards).
- **TC-006**: Implementation MUST support `backend-only`, `frontend-only`, and `integration-tests` execution modes (Principle VI).
- **TC-007**: Features MUST NOT use external libraries for simple logic that can be implemented manually (Principle VII).
- **TC-008**: All new files MUST be placed in appropriate subdirectories; project root MUST remain clean (Principle VIII).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: UI updates for deaths and dashes occur within 100ms of the WebSocket event being received.
- **SC-002**: Run history table reflects new runs within 200ms of level entry without manual refresh.
- **SC-003**: 100% of terminated runs (win or quit) record an accurate "Completion Time" timestamp in the local database.
- **SC-004**: Total death counter displays exactly `1` upon the first death event of a new session.

## Assumptions

- **A-001**: The static highlight persists until the run status changes from "Active" to "Completed" or "Aborted".
- **A-002**: "Completion Time" refers to the wall-clock time (e.g., `2026-04-14 10:30:00`) the run session ended.
- **A-003**: The WebSocket connection is stable enough for sub-second UI updates.
- **A-004**: The user wants "Completion Time" to be recorded for *every* session, even if it lasted only a few seconds.
