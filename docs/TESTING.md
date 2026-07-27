# testing/

The backend test suite for TheCelesteTrackerDesktop. Everything here runs under **Bun.js** (not Neutralino). These tests exercise app logic directly — no window, no browser, no Neutralino runtime.

## How it integrates with `src/`

The app is designed for Neutralino (production), but tests need to run in a plain Node/Bun process. The testing folder bridges that gap by providing **alternative implementations of the `src/interfaces/` abstractions** that use Node.js APIs instead of Neutralino APIs:

| Interface (`src/interfaces/`) | Test implementation (`testing/`) | What it swaps Neutralino for |
|---|---|---|
| `IFileSystem` | `helpers/NodeJsFileSystem.ts` | `node:fs/promises` |
| `IOS` | `helpers/NodeJsOs.ts` | `node:child_process` + `node:os` |
| `IPath` | `helpers/NodeJsPath.ts` | `node:path` (POSIX) |

These are registered in `setup.ts` via the DI container (`tsyringe`), so every service in `src/` (Celeste, Everest, Olympus, etc.) transparently uses Node.js APIs during tests with zero code changes.

## What lives here

| File / Folder | Role |
|---|---|
| `setup.ts` | DI wiring — the entry point. Registers all test implementations + app services. Configures test environment variables (`CTD_TEST_CELESTE_PATH`, `CTD_TEST_OLYMPUS_PATH`, `CTD_TEST_DATA_FOLDER`). Exports `GetDependency()` and `EnsureBuildAndGetPathExe()`. |
| `helpers/NodeJsFileSystem.ts` | Implementation of `IFileSystem` using `node:fs/promises`. Every filesystem method the app needs (read, write, watch, copy, stat, etc.). |
| `helpers/NodeJsOs.ts` | Implementation of `IOS` using Node APIs. Real methods for exec/spawn/env/paths; mock stores for Neutralino-only UI methods (tray, notifications, dialogs) so they don't crash. |
| `helpers/NodeJsPath.ts` | Implementation of `IPath` using `node:path`. |
| `helpers/FakeOsPathOverride.ts` | Subclass of `NodeJsOS` that overrides `getEnv` for instance-level path redirection without mutating global `process.env`. |

### Test Folders

| Test file | What it tests |
|---|---|
| **`celeste-tests/`** | |
| `celeste-tests/Celeste.integration.test.ts` | `Celeste` integration: path override seam, reading save slots, parsing vanilla stats from real `.celeste` save XML. |
| `celeste-tests/Celeste_SaveFile.test.ts` | Unit tests for `.celeste` save file parsing logic. |
| `celeste-tests/Everest.integration.test.ts` | `Everest` integration: installation path resolution, mod zip scanning (`GetModsInstalled`, `GetModsInstalledFull`) against real mod zips. |
| `celeste-tests/Everest_HistoricalLevelSets.test.ts` | `Everest` historical level set extraction from save files. |
| `celeste-tests/Olympus.integration.test.ts` | `Olympus` integration: installation path override, category & human name lookup against real cached JSONs, negative path & corrupt JSON handling. |
| `celeste-tests/LocalMods_ModDatabase.test.ts` | `DBMods` and local mod database join logic. |
| **`go-utils-tests/`** | |
| `go-utils-tests/Sqlite_Go_Usage.test.ts` | `Sqlite_Go` via DI container. |
| `go-utils-tests/Sqlite_Go_RawUsage.test.ts` | Raw Go CLI SQLite binary: flags, DML, DDL, JOINs, errors. |
| `go-utils-tests/Zip_Go_Usage.test.ts` | `Zip_Go` (pack/read/list/unzip) via DI container. |
| `go-utils-tests/Zip_Go_RawUsage.test.ts` | Raw Go CLI ZIP binary: pack/read/list/unzip, all error paths. |
| **`ui-tests/`** | |
| `ui-tests/GoldenLayout_Pinning.test.ts` | GoldenLayout tab pinning state tests. |
| `ui-tests/NewPage.test.ts` | New page option filtering and selector contracts. |

### Fixtures

| Fixture | Purpose |
|---|---|
| `dependencies/integration-tests/mocks/Celeste/` | Real 4-year Celeste install fixture (`Mods/` with zips, `Saves/` with 4 save slots + mod saves, `TheCelesteTracker_DB.db`, `Content/Maps/1-ForsakenCity.bin`) + `fixtures/` (save XML fixtures). |
| `dependencies/integration-tests/mocks/Olympus/` | Real Olympus config & cached JSON mappings (`cached-mod-ids-to-names.json`, `cached-mod-ids-to-categories.json`) + `fixtures/olympus-corrupt/` (corrupt JSON fixture). |
| `test_with_data.db` | Pre-populated SQLite (Users, Campaigns, Chapters, ChapterSides). |

## Environment Variable Overrides

- `CTD_TEST_CELESTE_PATH`: Points `Celeste.findPath()` to `./dependencies/integration-tests/mocks/Celeste` (short-circuiting hardcoded OS paths).
- `CTD_TEST_OLYMPUS_PATH`: Points `Olympus._findPath()` to `./dependencies/integration-tests/mocks/Olympus`.
- `CTD_TEST_DATA_FOLDER`: Redirects `Configuration.getDataFolderPath()` default fallback to `./testing/Data-Temp`.

## Running

```bash
bun test
```

The Go CLI helper (`bin/utilities-*`) is auto-built by `EnsureBuildAndGetPathExe()` if the binary is missing.
