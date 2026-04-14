<!--
Sync Impact Report:
- Version change: 1.2.0 → 1.3.0
- List of modified principles:
  - Principle VII: Added "Lean Dependency Management" to prioritize manual implementation of simple features and limit library usage.
  - Principle VIII: Added "Structural Hygiene" to mandate strict folder organization and minimize root-level file bloat.
- Added sections: none
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated
  - .specify/templates/spec-template.md ✅ updated
- Follow-up TODOs: none
-->

# TheCelesteTracker Desktop Constitution

## Core Principles

### 0. USE BUN INSTEAD OF NPM AS JS PACKAGE MANAGER

### 0.1 When making RUST changes, always do CARGO CHECK, and fix until build success.

### I. Zero-Effort Automation & free modification

Data tracking MUST be invisible and automatic. No necessary manual entry for runs, deaths, or progress. Real-time sync from Everest handles all data collection automatically. If user wants, he can modify anything from its stored data (CRUD: Create, Read, Update and Delete (with warnings before proceeding))

### II. Rust-Powered Reliability

Core backend logic (WS, DB, event handling) MUST be implemented in Rust. Strong typing for all gameplay events is mandatory to prevent runtime failures and ensure high performance.

### III. Reactive Svelte 5 UI

The frontend MUST use Svelte 5 Runes for state management. The UI MUST prioritize high-performance overlays that do not impact game FPS or disrupt the gameplay experience, and should update automatically when receiving stream-data from the rust backend without needing to refresh the page manually

### IV. Local-First Privacy

All gameplay data MUST be stored locally in SQLite (`path/to/**celeste_game_files**/Saves/TheCelesteTracker.db`). The application MUST operate as a standalone desktop tool without external cloud dependencies for core tracking.

### V. Community-Centric & Open

The project MUST be MIT licensed. It MUST support both vanilla Celeste and modded campaigns (LevelSets) to serve the entire community's progress tracking needs.

### VI. Decoupled Test Modes

The application MUST support three distinct testing execution modes to ensure development speed and targeted validation:
1.  **backend-only**: Executes unit and logic tests for Rust backend in isolation.
2.  **frontend-only**: Executes unit and logic tests for Svelte frontend in isolation.
3.  **integration-tests**: Executes cross-layer tests verifying backend-to-frontend functionality.

### VII. Lean Dependency Management

The project MUST minimize external dependencies. Features NOT natively provided by Rust/Tauri or Svelte/SvelteKit MUST be implemented manually if the effort is low-to-moderate. External libraries MUST ONLY be introduced when manual implementation requires significant architectural setup or introduces high maintenance risk.

### VIII. Structural Hygiene

Project organization MUST be strictly maintained to prevent "root bloat." All new files MUST be placed in appropriate subdirectories within `src/`, `src-tauri/`, or `.specify/`. The project root MUST remain clean, containing only essential configuration files and documentation.

## Technical Constraints

- **Runtime**: Tauri v2 (Rust backend, Webview frontend); DO NOT USE LEPTOS FOR FRONTEND.
- **State**: Svelte 5 Runes (`$state`, `$derived`, `$effect`).
- **Persistence**: SQLite (local filesystem, shared with mod).
- **Communication**: Local WebSockets (ports 50500-50600).

## Quality Standards

- **Type Safety**: No `any` in TypeScript; no `unwrap()` in Rust without `expect("rationale")`.
- **Backend Testing**: ALL core Rust backend code MUST have unit tests to verify logic and state integrity in isolation.
- **Frontend Testing**: ALL core frontend logic (Svelte modules/runes) MUST have unit tests to verify reactive state and data handling.
- **Styling**: Tailwind CSS MUST be used for all UI components to ensure consistency.

## Governance

The Constitution supersedes all other documentation and local development practices. All Pull Requests MUST pass a Constitution Check to ensure alignment with core principles. Amendments require a version bump and updated documentation.

**Version**: 1.3.0 | **Ratified**: 2026-04-13 | **Last Amended**: 2026-04-13
