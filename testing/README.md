# testing/

The backend test suite for TheCelesteTrackerDesktop. Everything here runs under **Bun.js** (not Neutralino). These tests exercise app logic directly — no window, no browser, no Neutralino runtime.

## How it integrates with `src/`

The app is designed for Neutralino (production), but tests need to run in a plain Node/Bun process. The testing folder bridges that gap by providing **alternative implementations of the `src/interfaces/` abstractions** that use Node.js APIs instead of Neutralino APIs:

| Interface (`src/interfaces/`) | Test implementation (`testing/`) | What it swaps Neutralino for |
|---|---|---|
| `IFileSystem` | `NodeJsFileSystem.ts` | `node:fs/promises` |
| `IOS` | `NodeJsOs.ts` | `node:child_process` + `node:os` |

These are registered in `setup.ts` via the DI container (`tsyringe`), so every service in `src/` (Celeste, Everest, Olympus, etc.) transparently uses Node.js APIs during tests with zero code changes.

## What lives here

| File | Role |
|---|---|
| `setup.ts` | DI wiring — the entry point. Registers all test implementations + app services. Exports `GetDependency()` (resolve any DI-registered class) and `EnsureBuildAndGetPathExe()` (auto-build the Go CLI helper). |
| `NodeJsFileSystem.ts` | Implementation of `IFileSystem` using `node:fs/promises`. Every filesystem method the app needs (read, write, watch, copy, stat, etc.). |
| `NodeJsOs.ts` | Implementation of `IOS` using Node APIs. Real methods for exec/spawn/env/paths; mock stores for Neutralino-only UI methods (tray, notifications, dialogs) so they don't crash. |
| `Storage.simpleMap.ts` | A `StorageAdapter` powered by an in-memory `Map`. Used as a zero-dependency cache layer in tests. |

| Test file | What it tests |
|---|---|
| `test.test.ts` | Smoke/integration tests for `Everest` (mod scanning: `GetModInfoByZipName`, `GetModsInstalled`). |
| `Sqlite_Go_Usage.test.ts` | `Sqlite_Go` via DI container. |
| `Sqlite_Go_RawUsage.test.ts` | Raw Go CLI SQLite binary: flags, DML, DDL, JOINs, errors. |
| `Zip_Go_Usage.test.ts` | `Zip_Go` (pack/read/list/unzip) via DI container. |
| `Zip_Go_RawUsage.test.ts` | Raw Go CLI ZIP binary: pack/read/list/unzip, all error paths. |

| Fixture | Purpose |
|---|---|
| `test_with_data.db` | Pre-populated SQLite (Users, Campaigns, Chapters, ChapterSides). |
| `test.db` | Empty/secondary database. |

## Running

```bash
bun test
```

The Go CLI helper (`bin/utilities-*`) is auto-built by `EnsureBuildAndGetPathExe()` if the binary is missing.
