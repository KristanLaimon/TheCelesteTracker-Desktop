# Tauri to Wails Migration Plan

## Background & Motivation
The user requested a full architectural migration from a Rust/Tauri backend to a Go/Wails backend. We'll utilize GORM for SQLite database access and integrate Wails natively into the root directory, pointing to the existing Astro/Svelte 5 frontend.

## Scope & Impact
- **Backend Replacement**: Remove `src-tauri` completely (after a successful migration).
- **Project Structure**: Introduce `wails.json` and a `main.go` at the root. The Go backend code will live in an `app/` directory.
- **Database**: Port 14 Sea-ORM models to GORM structs.
- **Commands**: Port ~13 Tauri commands (health, db crud, asset scanning) to Go struct methods exposed via Wails.
- **Frontend Integration**: Swap `@tauri-apps/api` calls (`invoke`, `convertFileSrc`) with Wails' generated JS bindings (`wailsjs/go/...`).

## Proposed Solution & Phased Implementation
1. **Initialization**
   - Create `wails.json` configured for Astro/Vite.
   - Create `main.go` and `app/app.go` to set up the Wails application lifecycle.
   - Update `package.json` scripts (`wails dev`, `wails build`).

2. **Database Migration (GORM)**
   - Initialize SQLite connection with GORM in Go.
   - Create Go structs in `app/models/` matching the existing Rust schemas (e.g., `Campaigns`, `Chapters`, `SaveDatas`).

3. **Porting Commands & Logic**
   - Translate DB queries (Sea-ORM -> GORM) for `runs_get_recent_ones`, `get_general_info`, etc.
   - Port `assets.rs` file system scanning and helper logic to Go.
   - Bind these methods to the Wails frontend.

4. **Frontend Binding Swap**
   - Generate Wails bindings (`wails dev` or `wails generate module`).
   - Replace `import { invoke } from "@tauri-apps/api/core"` across all `.svelte` and `.ts` files with Wails equivalents.

5. **Validation & Cleanup**
   - Verify asset loading, db reading, and health checks work.
   - Remove the old `src-tauri` directory.

## Alternatives Considered
- Keeping a `src-wails` directory to match the old structure exactly, but moving Go to the root (or an `app/` folder) is more idiomatic for Wails.
- Using `ent` or `sqlx` instead of `GORM`. The user selected `GORM` via a prior prompt.

## Verification
- Running `wails dev` correctly opens the app.
- Existing database (SQLite) can be read correctly by the new Go backend.
- Mod asset paths render correctly in the Svelte frontend.