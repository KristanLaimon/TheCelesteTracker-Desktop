# Test Path Mocking Seams & Environment Overrides

Created 2026-07-24.

## Context & Problem
`Celeste.findPath()` and `Olympus._findPath()` hardcode real OS install candidates (e.g. `C:/Program Files (x86)/Steam/steamapps/common/Celeste`). On developer machines with a real Celeste install, tests will hit the dev machine's actual installation unless short-circuited.

## Solution & Architecture
- **Environment Overrides**:
  - `Celeste.findPath()` checks `CTD_TEST_CELESTE_PATH` via `IOS.getEnv()`. If set and sentinel `Celeste.exe` exists, it short-circuits.
  - `Olympus._findPath()` checks `CTD_TEST_OLYMPUS_PATH` via `IOS.getEnv()`. If set and `config.json` exists, it resolves to `testing/Olympus`.
  - `Configuration.getDataFolderPath()` checks `CTD_TEST_DATA_FOLDER` fallback override before returning `./data`, avoiding write pollution to repo-root `./config.json` during test runs.

- **Instance Isolation (`FakeOsPathOverride`)**:
  - `testing/helpers/FakeOsPathOverride.ts` extends `NodeJsOS` and overrides `getEnv(key)` to provide instance-level env overrides.
  - Used for negative/corrupt path tests (e.g., non-existent paths, corrupt JSON) without mutating global `process.env`.

- **Biome Exclusions**:
  - Deliberately corrupt test JSON files (e.g., `testing/Olympus/fixtures/olympus-corrupt/cached-mod-ids-to-names.json`) must be excluded in `biome.json` under `files.includes` (`"!testing/Olympus/fixtures/olympus-corrupt/**"`), otherwise `biome check .` / `bun run lint:fix` fails on syntax errors.
