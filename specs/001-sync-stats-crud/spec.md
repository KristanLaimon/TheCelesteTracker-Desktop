# Feature Specification: Automated Progress Sync & Statistics CRUD

**Feature Branch**: `001-sync-stats-crud`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description of a companion app for Celeste/Everest modding client.

## Clarifications

### Session 2026-04-13
- Q: How should the companion app handle writes to the SQLite database? → A: Inactive-Only CRUD: App allows edits ONLY to maps/runs NOT currently being played.
- Q: Should "Best Attempt" track only the current session or absolute history? → A: Absolute Best: Scan all `Run` and `RoomDeath` history to find the furthest room ever reached.
- Q: How should the app handle switching between different Celeste save slots? → A: Hybrid: App highlights the active slot but allows browsing others without switching the "Live" view.
- Q: Where should the app "optimistically" fetch mod metadata from? → A: Hybrid: Use existing DB data first; fetch from Everest API only when a mod is first encountered via WebSocket.
- Q: How should the app handle WebSocket disconnection during an active run? → A: Stale Marker: Keep the run data as-is but flag it as "Incomplete/Disconnected" in the history.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Sync (Priority: P1)

When the companion app first connects to Celeste and the player enters a save file, the app automatically fetches and persists all vanilla and modded statistics for that slot.

**Why this priority**: Essential for immediate user value and baseline data accuracy.

**Independent Test**: Connect app to a new Celeste session, enter a save slot, and verify `Saves/TheCelesteTracker.db` reflects current in-game totals.

**Acceptance Scenarios**:

1. **Given** no prior data for a save slot, **When** the app receives a `DatabaseLocation` event on connection, **Then** it must read and display `deaths`, `dashes`, and `hearts` for all chapters in that slot.
2. **Given** modded maps are installed, **When** the app initializes, **Then** it must optimistically identify and display those campaigns currently present in the SQLite database.
3. **Given** a mod map is played for the first time, **When** its `LevelStart` event is received via WebSocket, **Then** the app MUST use the Everest API to fetch full metadata and add it to the local tracker database.
4. **Given** the player switches save slots in Celeste, **When** the app receives the update, **Then** it MUST highlight the new active slot while allowing the user to continue browsing the previous slot's data (Hybrid navigation).

---

### User Story 2 - Real-Time Live Tracking (Priority: P1)

While the player is in-game, the companion app UI updates instantly when deaths, dashes, or level completions occur without requiring a manual refresh.

**Why this priority**: Core value of a "Live Companion" tool.

**Independent Test**: Perform a dash/death in Celeste and verify the app's "Current Run" UI updates within 500ms.

**Acceptance Scenarios**:

1. **Given** an active run, **When** a `Death` event is received via WebSocket, **Then** the death count for the current `Run` must increment in the UI.
2. **Given** a chapter completion, **When** an `AreaComplete` event is received, **Then** the final run stats must be persisted to the database and displayed as a "Completed Run."

---

### User Story 3 - Statistics CRUD (Priority: P2)

Users can manually correct or modify existing statistics (SaveData -> Campaign -> Chapter -> Run) to fix tracking errors or manage their journey history.

**Why this priority**: Standard utility for any tracker; allows users to maintain data integrity.

**Independent Test**: Edit a death count for a past run in the UI and verify the SQLite database reflects the change.

**Acceptance Scenarios**:

1. **Given** a historical `Run`, **When** the user modifies the death count, **Then** the new value is saved and all higher-level aggregates (Chapter total) are recalculated.
2. **Given** a redundant `Run`, **When** the user deletes it, **Then** a warning is shown before the dash is permanently removed.

---

### User Story 4 - Visual Excellence & Golden Consistency (Priority: P2)

As a player, I want a beautiful alternative to manual Excel tracking that visualizes my progress, room-by-room consistency, and rewards Golden Strawberry completions with special UI badges.

**Why this priority**: Differentiates the app from spreadsheets; provides emotional reward and tactical insights for speedrunning/Goldens.

**Independent Test**: Complete a Golden Strawberry run and verify the Chapter UI displays a "Golden Badge/Background" and correctly plots the "Room Deaths" heat map.

**Acceptance Scenarios**:

1. **Given** a chapter with multiple rooms, **When** the app receives `Death` events with `RoomName`, **Then** it must visualize which rooms have the highest death density.
2. **Given** a run in progress, **When** the player reaches a new room, **Then** the app must update the "Best Attempt" (furthest room reached) for that run.
3. **Given** a completed run with `Golden: true`, **When** viewing the chapter, **Then** the UI MUST display a prominent golden badge or unique visual theme.

---

### User Story 5 - Mod Lobby Support (Priority: P2)

As a modded Celeste player, I want the app to correctly identify and organize "Lobby Maps" (mods containing multiple sub-chapters) as unified Campaigns so my progress is structured logically.

**Why this priority**: Fixes a common modding tracking pain point where complex mods become disorganized.

**Independent Test**: Launch a lobby mod (e.g., Spring Collab) and verify it appears as a single `Campaign` with all its sub-levels listed as `Chapters`.

**Acceptance Scenarios**:

1. **Given** a mod with lobby structure, **When** scanning the database, **Then** the app must group all sub-chapters under the parent mod's `Campaign` name.
2. **Given** a player is inside a lobby room, **When** they enter a sub-chapter door, **Then** the app must transition the "Current Run" context to that specific sub-chapter.

---

### User Story 6 - App Launch Personalization (Priority: P3)

As a user, I want to configure where the companion app opens so I can quickly resume my tracking without navigating menus every time.

**Why this priority**: Improves user experience and reduces friction for frequent users.

**Independent Test**: Set launch behavior to "Last Session" and verify the app opens on the previous chapter view after restart.

**Acceptance Scenarios**:

1. **Given** the app is configured to start at "Main Menu", **When** launched, **Then** it must show the root campaign list.
2. **Given** the app is configured to start at "Last Session", **When** launched, **Then** it must automatically navigate to the last viewed screen.
3. **Given** a specific "Default Page" or "Campaign" is pinned, **When** launched, **Then** it must open directly to that selection.

---

### User Story 7 - Visual Personalization (Priority: P3)

As a user, I want to customize the visual style and theme colors of the app to match my personal aesthetic preferences.

**Why this priority**: Enhances user ownership and enjoyment of the tool; provides a more comfortable viewing experience.

**Independent Test**: Change the app theme to a "Dark" or custom color scheme and verify all UI elements update immediately.

**Acceptance Scenarios**:

1. **Given** the settings menu, **When** the user selects a new theme color, **Then** the primary and secondary colors of the app MUST update across all screens.
2. **Given** a custom theme is saved, **When** the app is restarted, **Then** it MUST persist and reload the selected visual style.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically detect and connect to Everest WebSocket on ports 50500-50600.
- **FR-002**: System MUST parse `DatabaseLocation` to initialize the SQLite connection.
- **FR-003**: System MUST fetch and persist `deaths`, `crystal hearts` (0-n), `strawberries` (0-n), `B-Sides`, and `C-Sides` for every save file entered.
- **FR-004**: System MUST perform "Optimistic Mod Fetching" by querying existing SQLite records on startup and using the Everest API for metadata when new mods are encountered via WebSocket.
- **FR-005**: System MUST track `dashes` on a best-effort basis; dashes MUST be associated with individual `Run` entities only and NOT aggregated at the global chapter level if data is inconsistent.
- **FR-006**: System MUST provide a CRUD interface for `SaveData`, `Campaign`, `Chapter`, and `Run` entities, RESTRICTED to entities not currently active in a live game session.
- **FR-007**: System MUST background the initial sync to ensure the UI remains responsive.
- **FR-008**: System MUST track and visualize `RoomDeath` history to identify consistency bottlenecks.
- **FR-009**: System MUST track "Absolute Best Attempt" (furthest room ever reached) across all historical runs for each chapter.
- **FR-010**: System MUST apply a unique "Golden" visual state (badge/background) to chapters where a Golden Strawberry has been collected.
- **FR-011**: System MUST identify "Lobby" structures in modded maps and group sub-levels under their respective parent `Campaign`.
- **FR-012**: System MUST allow users to select ONE "Start Behavior" from: Main Menu, Last Session, Specific Page/Section, or Specific Campaign.
- **FR-013**: App configuration MUST be stored in a `config.json` file located in the same directory as the application executable.
- **FR-014**: System MUST provide theme customization options, including primary color selection and personalization styles (font-size scaling, border-radius rounding, and spacing density).
- **FR-015**: System MUST highlight the save slot currently active in Celeste while allowing independent browsing of other slots.

### Technical Constraints

<!--
  MANDATORY: Verify alignment with TheCelesteTracker Constitution.
-->

- **TC-001**: Feature MUST NOT require manual user input for data tracking (Principle I).
- **TC-002**: Core backend logic MUST be implemented in Rust (Principle II).
- **TC-003**: UI MUST use Svelte 5 Runes for state and minimize FPS impact (Principle III).
- **TC-004**: All feature data MUST remain local to the user's machine (Principle IV).
- **TC-005**: All core logic MUST be covered by separate Rust and Svelte unit tests (Quality Standards).
- **TC-006**: Implementation MUST support `backend-only`, `frontend-only`, and `integration-tests` execution modes (Principle VI).
- **TC-007**: Features MUST NOT use external libraries for simple logic that can be implemented manually (Principle VII).
- **TC-008**: All new files MUST be placed in appropriate subdirectories; project root MUST remain clean (Principle VIII).

### Key Entities *(include if feature involves data)*

- **SaveData**: Represents a Celeste save slot (0, 1, or 2).
- **Campaign**: A group of chapters (Vanilla "Celeste", a Mod name, or a Lobby parent).
- **Chapter**: Individual level with unique SID, name, mode (A/B/C), and Golden status.
- **Run**: A single attempt at a chapter, tracking deaths, dashes, strawberries, and completion time.
- **RoomDeath**: Per-room death counter to visualize consistency.
- **AppSettings**: Local configuration for start behavior, theme, and personalization styles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Initial sync of all statistics for a new save file completes in under 2 seconds.
- **SC-002**: UI updates for gameplay events (Death/Dash) occur with <200ms latency.
- **SC-003**: Users can identify their "Deadliest Room" for a chapter at a glance via a sorted bar chart or death-density list.
- **SC-004**: 100% of vanilla and modded chapters identified by the Everest mod are correctly mirrored in the companion app.
- **SC-005**: Visual "Golden" reward state triggers immediately upon receipt of a `Golden: true` flag in `AreaComplete`.
- **SC-006**: Multi-chapter mods (Lobbies) are successfully grouped into a single Campaign view with 0 manual intervention.
- **SC-007**: "Absolute Best Attempt" is updated in the UI within 500ms of the player entering a room they have never reached before.
- **SC-008**: App navigates to the configured start screen within 100ms of state initialization.
- **SC-009**: Theme changes are applied globally across the application in under 50ms without requiring a restart.

## Edge Cases

- **EC-001**: **Write Collision**: System MUST prevent manual CRUD operations on the Chapter/Run currently being tracked via WebSocket to avoid data corruption.
- **EC-002**: **Database Lock**: System SHOULD implement retry logic for SQLite writes if the game process holds an exclusive lock.
- **EC-003**: **Missing Session**: If "Start at Last Session" is selected but no session exists, system MUST fallback to "Main Menu".
- **EC-004**: **Corrupted Config**: If `config.json` is missing or malformed, system MUST fallback to default settings and attempt to recreate a valid file.
- **EC-005**: **WebSocket Disconnection**: If the connection is lost during an active run, the system MUST preserve data received until that point and mark the run as "Incomplete/Disconnected."

## Assumptions

- **A-001**: The Everest mod is configured to expose the SQLite database path via `DatabaseLocation`.
- **A-002**: Users want "Optimistic Fetch" to see their entire mod library before they start playing each individual map.
- **A-003**: Real-time updates take precedence over historical data accuracy if a conflict occurs during a live run.
- **A-004**: "Lobby" relationships can be derived from the Chapter SID or Campaign metadata provided by Everest/SQLite.
- **A-005**: App configuration is stored in `config.json` adjacent to the executable, adhering to the user's portability preference.
