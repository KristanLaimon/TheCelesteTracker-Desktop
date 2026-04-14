---
description: "Task list for Automated Progress Sync & Statistics CRUD"
---

# Tasks: Automated Progress Sync & Statistics CRUD

**Input**: Design documents from `/specs/001-sync-stats-crud/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/interface.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: [US1], [US2], etc. (maps to spec.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan
- [x] T002 Configure `src-tauri/tauri.conf.json` with SQLite and WebSocket permissions
- [x] T003 [P] Initialize `src/lib/logic` and `src/lib/components` directories
- [x] T004 [P] Configure Tailwind CSS 4.0 in `src/app.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for persistence and communication

- [x] T005 [P] Implement `AppSettings` handler in `src-tauri/src/config.rs` with executable-relative directory resolution
- [x] T006 Implement SQLite schema for `User`, `SaveData`, `Campaign` (with parent link), `Chapter`, `Run`, and `RoomDeath` in `src-tauri/src/db.rs`
- [x] T007 [P] Initialize basic WebSocket listener shell in `src-tauri/src/ws.rs`
- [x] T008 [P] Define TypeScript types for all entities, including recursive `Campaign` nesting, in `src/lib/types/entities.ts`

**Checkpoint**: Core data access and communication shells ready.

---

## Phase 3: User Story 1 - Initial Sync (Priority: P1)

**Goal**: Automatically fetch and persist statistics when connecting to a save file.

**Independent Test**: Connect app to Celeste, enter save slot, verify SQLite has parity with in-game stats.

### Implementation for User Story 1

- [x] T009 [P] [US1] Rust unit test for `DatabaseLocation` event parsing in `src-tauri/src/events.rs`
- [x] T010 [US1] Implement `DatabaseLocation` handler to initialize SQLite connection in `src-tauri/src/ws.rs`
- [x] T011 [US1] Create background sync logic to fetch initial chapter stats in `src-tauri/src/db.rs`
- [x] T012 [P] [US1] Implement `fetch_all_stats` Tauri command in `src-tauri/src/lib.rs`
- [x] T013 [US1] Create `src/lib/logic/sync_store.svelte.ts` to manage initial data load
- [x] T014 [US1] Implement `src/lib/components/CampaignList.svelte` to display synced data

**Checkpoint**: Initial sync functional and visible.

---

## Phase 4: User Story 2 - Real-Time Live Tracking (Priority: P1)

**Goal**: Update UI instantly for deaths, dashes, and room transitions.

**Independent Test**: Trigger a death in-game, verify death count increments in app UI in <200ms.

### Implementation for User Story 2

- [x] T015 [P] [US2] Rust unit tests for `Death`, `Dash`, and `AreaComplete` event parsing
- [x] T016 [US2] Implement live event dispatching from `src-tauri/src/ws.rs` to frontend via Tauri events
- [x] T017 [US2] Update `sync_store.svelte.ts` to process live events and update Run state reactivey
- [x] T018 [US2] Implement "Current Run" HUD component in `src/lib/components/LiveTracker.svelte`
- [x] T019 [US2] Add logic to persist `AreaComplete` results to SQLite in `src-tauri/src/db.rs`

**Checkpoint**: Real-time tracking loop complete.

---

## Phase 5: User Story 3 - Statistics CRUD (Priority: P2)

**Goal**: Manual correction of statistics for inactive maps.

**Independent Test**: Edit a past run's death count, verify SQLite update, ensure active run cannot be edited.

### Implementation for User Story 3

- [x] T020 [P] [US3] Implement `update_run` and `delete_run` commands with "inactive-only" guard in `src-tauri/src/db.rs`
- [x] T021 [US3] Create `src/lib/components/RunEditor.svelte` with CRUD interface
- [ ] T022 [US3] Add validation logic to `sync_store.svelte.ts` to disable editing for the currently tracked run

---

## Phase 6: User Story 4 - Visual Excellence & Consistency (Priority: P2)

**Goal**: Heatmaps for room deaths and Golden badges.

### Implementation for User Story 4

- [ ] T023 [P] [US4] Implement `RoomDeath` query logic in `src-tauri/src/db.rs`
- [ ] T024 [US4] Create `src/lib/components/RoomHeatmap.svelte` to visualize death density
- [ ] T025 [US4] Implement "Absolute Best Attempt" logic in `sync_store.svelte.ts`
- [ ] T026 [US4] Add "Golden Theme" visual states to `ChapterView.svelte` using Tailwind transitions

---

## Phase 7: User Story 5 - Mod Lobby Support (Priority: P2)

**Goal**: Correct organization of multi-chapter mods.

### Implementation for User Story 5

- [ ] T027 [US5] Implement Lobby detection logic using chapter SID patterns in `src-tauri/src/db.rs`
- [ ] T028 [US5] Update `Campaign` entity to support nesting in `src/lib/types/entities.ts`
- [ ] T029 [US5] Implement recursive campaign rendering in `src/lib/components/CampaignList.svelte`

---

## Phase 8: User Story 6 & 7 - Personalization (Priority: P3)

**Goal**: Start behavior and Theme customization.

### Implementation for User Story 6 & 7

- [ ] T030 [P] [US6] Implement start-up navigation logic in `src/routes/+layout.svelte` based on `config.json`
- [ ] T031 [P] [US7] Create theme switching system using CSS variables and Tailwind 4.0 dark mode
- [ ] T032 [US7] Add theme picker to `src/lib/components/Settings.svelte`

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization and robustness

- [ ] T033 [P] Audit all TS files for `any` types and Rust files for `unwrap()` (Quality Standards)
- [ ] T034 [P] Verify overlay performance impact is <1ms (Principle III)
- [ ] T035 Implement SQLite retry logic for database locks (EC-002) in `src-tauri/src/db.rs`
- [ ] T036 [P] Create integration tests (Playwright) for `integration-test` mode in `tests/integration/`
- [ ] T037 [P] Benchmark initial sync time (<2s) and live update latency (<200ms) (SC-001, SC-002)
- [ ] T038 [P] Verify app launch navigation time (<100ms) and theme application time (<50ms) (SC-008, SC-009)

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies.
2. **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories.
3. **P1 Stories (Phases 3-4)**: Must complete US1 before US2 (Tracking depends on Sync initialization).
4. **P2 Stories (Phases 5-7)**: Can proceed in parallel after P1 stories are stable.
5. **P3 Stories (Phase 8)**: Depends on general app structure.
6. **Polish (Phase 10)**: Final pass.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1 & 2.
2. Implement US1 (Initial Sync).
3. Implement US2 (Live Tracking).
4. **STOP and VALIDATE**: Test real-time sync with Celeste. This is the core value.

### Incremental Delivery

1. Add CRUD (US3) for maintenance.
2. Add Visuals (US4) and Lobbies (US5) for power users.
3. Add Personalization (US6/7) for polish.
