# 12-modular-go-dependencies-architecture.md

## Context
Refactored native Go CLI helpers from monolithic single-file binaries into 3 modular Go projects under `dependencies/`:
1. `dependencies/CelesteMapsBinParser`
2. `dependencies/CelesteModsParser`
3. `dependencies/Sqlite`

## Architecture & Learnings
1. **Directory Structure**:
   - Each Go project under `dependencies/` has its own `go.mod`, `main.go`, `cmd/` (Cobra subcommands per file), and `pkg/` (domain modules following SOLID principles).
   - `dependencies/build.ts` compiles all 3 projects into `dependencies/build/` and places local OS binaries in `dependencies/` for dev mode execution.
   - `scripts/build.ts` replaces root `build.js`, triggering `dependencies/build.ts` and packaging binaries into `dist/prod/{windows,linux,mac}/dependencies/`.
2. **TS Wrapper Resolution**:
   - `Generic_Go.ts` accepts binary base names (`"Sqlite"`, `"CelesteModsParser"`, `"CelesteMapsBinParser"`) and resolves paths from `./dependencies/`, `./dependencies/build/`, or `./`.
   - `Sqlite_Go` passes `"Sqlite"`.
   - `Zip_Go` dispatches zip commands to `"CelesteModsParser"` and map-bin parsing commands to `"CelesteMapsBinParser"`.
