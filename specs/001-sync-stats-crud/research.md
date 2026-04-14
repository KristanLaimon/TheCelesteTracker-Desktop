# Research: Automated Progress Sync & Statistics CRUD

## Decision: Rust WebSocket Client
- **Rationale**: Core principle II requires Rust for backend logic. Tauri v2 provides native support for `tokio` and `tungstenite`.
- **Alternatives considered**: SvelteKit-based WebSocket client (Rejected: Principle II mandate).

## Decision: SQLite Integration (Tauri Plugin SQLite)
- **Rationale**: Principle IV and Project Directives specify local-first SQLite (`Saves/TheCelesteTracker.db`). Using the Tauri SQLite plugin ensures high performance and type safety.
- **Alternatives considered**: Manual `rusqlite` implementation (Rejected: Plugin handles Tauri-side state better).

## Decision: Svelte 5 Runes for State
- **Rationale**: Principle III mandate. `$state` and `$derived` will be used to manage the reactive campaign/chapter hierarchy.
- **Alternatives considered**: Svelte 4 Stores (Rejected: Principle III mandate).

## Decision: Local-Only Port Discovery
- **Rationale**: API.md specifies ports 50500-50600. App will scan these locally on startup to find Everest.
- **Alternatives considered**: Manual port configuration (Rejected: Principle I mandate - zero-effort).
