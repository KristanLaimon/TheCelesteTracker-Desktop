# src-utils/

Native CLI helpers + TypeScript wrappers. This is the **backend-of-the-backend** — tiny Go binaries that do one thing well (SQLite, ZIP), invoked as child processes, communicating via JSON over stdout. Everything here runs server-side (Bun/Node), not in the Neutralino frontend.

## Architecture

```
src/ (TS app)   →   src-utils/ (TS wrappers)   →   bin/ (Go binaries)
                         ↕
                    Go source (compiled ahead of time)
```

The Go binaries are compiled at build time (`bun run build`) into `bin/`. At runtime, the TypeScript wrappers find the binary, spawn it, and parse its JSON output. No CGO, no platform-specific DLLs — the Go binaries are self-contained.

## What's here

### Go Source (compiled to `bin/`)

| File | Build tag | Binary | What it does |
|---|---|---|---|
| `main.go` + `sqlite.go` | `!zip_utils` | `utilities-{os}_{arch}` | SQLite queries + ZIP operations (read, list, unzip, pack). Uses `github.com/glebarez/go-sqlite` (pure Go, no C lib). |
| `zip_main.go` + `zip.go` | `zip_utils` | `zip_utils-{os}_{arch}` | ZIP only — stdlib-only build, no libc dependency, smaller binary. |
| `shared.go` | both | shared | JSON result structs + `send()`/`fail()` helpers. |

Two separate binaries because the SQLite variant pulls in a larger dependency tree; the ZIP-only variant stays tiny for scenarios that only need archive operations.

### TypeScript Wrappers (DI-integrated)

| File | Role |
|---|---|
| `Generic_Go.ts` | Base class. Resolves the Go binary path on the current platform (`utilities-*`), searches `./` and `./bin/`. DI-injectable. |
| `Sqlite_Go.ts` | Extends `Generic_Go`. Methods: `Execute<T>(sql, params)` (any statement, `?` placeholders bound by SQLite), plus the `Query<T>()`/`Exec()` wrappers over it. Validates the DB file exists on construction. |
| `Zip_Go.ts` | Extends `Generic_Go` but routes to `zip_utils-*` binary. Methods: `readTextFile()`, `list()`, `unzip()`, `zip()`. |
| `NodePath.ts` | Pure `IPath` implementation wrapping `node:path` — the only wrapper that doesn't shell out. Registered as a DI value. |

### Build

| File | Purpose |
|---|---|
| `build.ts` | Cross-compiles all Go binaries for win/mac/linux x64. Run with `bun run build` from repo root. Output goes to `bin/`. |
| `go.mod` / `go.sum` | Go module dependencies. |
| `build/` | Intermediate build output directory. |
| `bin/` | Final compiled binaries (also symlinked from repo root `bin/`). |

## How it integrates with `src/`

All wrappers use DI (`tsyringe`) and conform to patterns in `src/interfaces/`:

- `Generic_Go` injects `IOS`, `IFileSystem`, `IPath` to find and execute the binary
- `NodePath` is a direct implementation of `IPath` using `node:path`
- `Sqlite_Go` and `Zip_Go` are registered as singletons and used by services in `src/libs/`
- In the Neutralino runtime, the same wrappers work because `IFileSystem`/`IOS` are backed by Neutralino APIs; in tests, they use Node.js implementations from `testing/`

## Communication protocol

All Go commands output a single JSON line to stdout:
```json
{"success": true, "rows": [...], "changes": 0, "lastInsertRowId": 0}
{"success": false, "error": "message"}
```

On failure the binary exits with code 1. The TS wrappers parse the JSON and throw on `success: false`.

The `sqlite` subcommand reads its statement from stdin in one of two forms:

```json
{"sql": "SELECT * FROM Campaigns WHERE id = ?", "params": [3]}
```

or a raw SQL string (anything not starting with `{`, also what `--query` takes). Values in `params` are bound by SQLite, never interpolated — this is the path `Sqlite_Go.Execute()` and the Kysely dialect use. Each invocation is its own process and connection, so transactions, temp tables and PRAGMA state cannot span calls.

## Building

```bash
bun run build        # builds all Go binaries
bun run build -- --skip-linux   # skip linux target
```
