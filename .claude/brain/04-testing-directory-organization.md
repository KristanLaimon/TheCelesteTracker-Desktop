# Testing Directory Organization & Relative Imports

Created 2026-07-24.

## Context & Problem
As the test suite grew, placing all test files (`*.test.ts`), test helpers (`NodeJsOS.ts`, `NodeJsFileSystem.ts`, `NodeJsPath.ts`, `FakeOsPathOverride.ts`), and root-level fixtures (`fixtures/celeste-save-*.xml`, `fixtures/olympus-corrupt/`) directly inside `testing/` created clutter and made navigation harder.

## Architecture & Conventions
1. **Helper Files**: Placed under `testing/helpers/` (`NodeJsFileSystem.ts`, `NodeJsOs.ts`, `NodeJsPath.ts`, `FakeOsPathOverride.ts`).
2. **Domain-Nested Fixtures**: Fixtures are nested inside their respective install mock subdirectories rather than a generic top-level `fixtures/` folder:
   - `testing/Celeste/fixtures/` (`celeste-save-*.xml`)
   - `testing/Olympus/fixtures/olympus-corrupt/`
3. **Categorized Test Subdirectories**:
   - `testing/celeste-tests/` (`Celeste.integration.test.ts`, `Celeste_SaveFile.test.ts`, `Everest.integration.test.ts`, `Everest_HistoricalLevelSets.test.ts`, `Olympus.integration.test.ts`, `LocalMods_ModDatabase.test.ts`)
   - `testing/go-utils-tests/` (`Sqlite_Go_Usage.test.ts`, `Sqlite_Go_RawUsage.test.ts`, `Zip_Go_Usage.test.ts`, `Zip_Go_RawUsage.test.ts`)
   - `testing/ui-tests/` (`GoldenLayout_Pinning.test.ts`, `NewPage.test.ts`)
4. **Root Files**:
   - `testing/setup.ts` remains at root (`bunfig.toml` preloads `./testing/setup.ts`).
   - `testing/test_with_data.db` remains at root (`setup.ts` registers singleton path `join(TEST_FOLDER, "test_with_data.db")`).

## Import Depth & Path Traversal Learnings
- Nesting test files one directory level deeper (`testing/celeste-tests/`) means relative imports to `src/` must step back two levels (`../../src/...` instead of `../src/...`).
- Imports from test files to `setup.ts` adjust from `./setup` to `../setup`.
- Temporary directory allocations in `Zip_Go` tests (`TMP_DIR`) should use `TEST_TEMP_FOLDER` from `setup.ts` to stay within `.gitignore` rules (`testing/temp`, `testing/Data-Temp/*`).
- `biome.json` exclusion patterns must match the nested fixture paths (`!testing/Olympus/fixtures/olympus-corrupt`).
