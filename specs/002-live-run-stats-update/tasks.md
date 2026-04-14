# Tasks: Live Run Stats & Real-time Updates

## Implementation Strategy

We follow an MVP-first approach, prioritizing the core real-time tracking logic (US1 and US3) before moving to campaign-wide aggregations (US2).

1.  **Foundational**: Update types and backend helpers.
2.  **User Story 1 & 3 (Core Tracker)**: Implement the active session logic and dual death counters.
3.  **User Story 2 (Aggregates)**: Implement derived campaign stats.
4.  **Persistence**: Finalize and save runs to the database.

## Phase 1: Setup

- [ ] T001 Define `RunStatus` and update `Run` entity in `src/lib/types/entities.ts`
- [ ] T002 Add `room_deaths` field to `Run` type in `src/lib/types/entities.ts`

## Phase 2: Foundational

- [ ] T003 Implement `finalize_run` command in `src-tauri/src/db.rs` to handle system timestamping and persistence
- [ ] T004 Register `finalize_run` command in `src-tauri/src/lib.rs`
- [ ] T005 [P] Create Rust unit tests for `finalize_run` in `src-tauri/src/db.rs`

## Phase 3: User Story 1 - Real-time Run History Updates (Priority: P1)

**Story Goal**: See current run appear and update in history table in real-time.
**Independent Test**: Start run in Celeste; verify new highlighted row appears and increments stats.

- [ ] T006 [US1] Initialize `currentRun` with `Active` status on `LevelStart` in `src/lib/logic/sync_store.svelte.ts`
- [ ] T007 [US1] Implement real-time stat updates for `currentRun` on `Death` and `Dash` events in `src/lib/logic/sync_store.svelte.ts`
- [ ] T008 [US1] Apply CSS class for static highlight on active runs in `src/lib/components/RunList.svelte`
- [ ] T009 [P] [US1] Create Vitest mock for `LevelStart` and verify `currentRun` initialization in `tests/unit/sync_store.test.ts`
- [ ] T010 [P] [US1] Create Vitest mock for `Death` event and verify `currentRun.deaths` increments in `tests/unit/sync_store.test.ts`

## Phase 4: User Story 3 - Dual Death Counter Overlay (Priority: P1)

**Story Goal**: Display total deaths and current room deaths side-by-side.
**Independent Test**: Verify both counters update correctly; Room Deaths resets on room transition.

- [ ] T011 [US3] Fix off-by-one bug: initialize `currentRun.deaths` to `1` on first `Death` event if not already tracked in `src/lib/logic/sync_store.svelte.ts`
- [ ] T012 [US3] Implement room death reset logic on `LevelInfo` event in `src/lib/logic/sync_store.svelte.ts`
- [ ] T013 [US3] Add `Total Deaths` and `Room Deaths` display to `src/lib/components/LiveTracker.svelte`
- [ ] T014 [P] [US3] Create Vitest mock for `LevelInfo` and verify `room_deaths` reset in `tests/unit/sync_store.test.ts`

## Phase 5: User Story 2 - Real-time Campaign Stat Aggregation (Priority: P2)

**Story Goal**: Update total campaign stats (deaths, dashes) in real-time.
**Independent Test**: View Campaign screen while playing; verify totals increment with every death.

- [ ] T015 [US2] Implement `$derived` campaign totals (historic + active run) in `src/lib/logic/sync_store.svelte.ts`
- [ ] T016 [US2] Update `src/lib/components/CampaignList.svelte` to use the new derived live totals
- [ ] T017 [P] [US2] Create Vitest mock for `Death` event and verify campaign total increments in `tests/unit/sync_store.test.ts`

## Phase 6: Polish & Cross-cutting Concerns

- [ ] T018 Implement run finalization call on `MenuAction` or `AreaComplete` in `src/lib/logic/sync_store.svelte.ts`
- [ ] T019 Add success notification upon successful run save in `src/lib/logic/sync_store.svelte.ts`
- [ ] T020 [P] Verify end-to-end flow with integration test in `tests/integration/sync.test.ts`

## Dependencies

- Phase 2 (Foundational) MUST be completed before Phase 6 (Polish).
- Phase 3 (US1) is required for Phase 4 (US3) and Phase 5 (US2) as they depend on `currentRun` state.

## Parallel Execution Examples

- **Story 1 (US1)**: T009 and T010 (Vitest mocks) can be written in parallel once T006 and T007 are outlined.
- **Story 3 (US3)**: T014 can be written in parallel with T011-T013.
- **Foundational**: T005 (Rust tests) can be written in parallel with T003 (command implementation).
