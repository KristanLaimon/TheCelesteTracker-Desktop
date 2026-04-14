<!--
Sync Impact Report:
- Version change: none → 1.0.0
- List of modified principles: none (initial setup)
- Added sections: Core Principles, Technical Constraints, Quality Standards, Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated
  - .specify/templates/spec-template.md ✅ updated
  - .specify/templates/tasks-template.md ✅ updated
- Follow-up TODOs: none
-->

# TheCelesteTracker Desktop Constitution

## Core Principles

### I. Zero-Effort Automation & free modification

Data tracking MUST be invisible and automatic. No necessary manual entry for runs, deaths, or progress. Real-time sync from Everest handles all data collection automatically. If user wants, he can modify anything from its stored data (CRUD: Create, Read, Update and Delete (with warnings before proceeding))

### II. Rust-Powered Reliability

Core backend logic (WS, DB, event handling) MUST be implemented in Rust. Strong typing for all gameplay events is mandatory to prevent runtime failures and ensure high performance.

### III. Reactive Svelte 5 UI

The frontend MUST use Svelte 5 Runes for state management. The UI MUST prioritize high-performance overlays that do not impact game FPS or disrupt the gameplay experience, and should update automatically when receiving stream-data from the rust backend without needing to refresh the page manually

### IV. Local-First Privacy

All gameplay data MUST be stored locally in SQLite (`Saves/TheCelesteTracker.db`). The application MUST operate as a standalone desktop tool without external cloud dependencies for core tracking.

### V. Community-Centric & Open

The project MUST be MIT licensed. It MUST support both vanilla Celeste and modded campaigns (LevelSets) to serve the entire community's progress tracking needs.

## Technical Constraints

- **Runtime**: Tauri v2 (Rust backend, Webview frontend); DO NOT USE LEPTOS FOR FRONTEND.
- **State**: Svelte 5 Runes (`$state`, `$derived`, `$effect`).
- **Persistence**: SQLite (local filesystem, shared with mod).
- **Communication**: Local WebSockets (ports 50500-50600).

## Quality Standards

- **Type Safety**: No `any` in TypeScript; no `unwrap()` in Rust without `expect("rationale")`.
- **Testing**: Core logic in `src-tauri` and `src/lib/logic` SHOULD have unit tests to verify event parsing and state transitions.
- **Styling**: Tailwind CSS MUST be used for all UI components to ensure consistency.

## Governance

The Constitution supersedes all other documentation and local development practices. All Pull Requests MUST pass a Constitution Check to ensure alignment with core principles. Amendments require a version bump and updated documentation.

**Version**: 1.0.0 | **Ratified**: 2026-04-13 | **Last Amended**: 2026-04-13
