# Architecture

Quick map of how the pieces wire together. For business rules (Celeste domain specifics, mod support, statistics indexing), see `CLAUDE.md`. This file is structural only.

## Two DI composition roots

`tsyringe` container, registered twice against the same interface tokens (`IFileSystem_Token`, `IOs_Token`, `IPath_Token`, `IThreadConstructor_Token` in `src/core/interfaces/DependencyInjectionTokens.ts`):

- `src/setup.ts` — production root. Registers `NeutralinoFileSystem`, `NeutralinoOS`, `BrowserPath`, `ThreadBrowser`. Loaded only from `src/index.ts` (the real browser entry point).
- `testing/setup.ts` — test root. Registers `NodeJsFileSystem`, `NodeJsOS`, `NodeJsPath`, `BunThread`. Loaded only from test files.

Business logic (`Everest`, `Celeste`, `Olympus`, `DBMods`, etc.) is written once against the interfaces and never imports a concrete `Neutralino*`/`NodeJs*` class directly — that's what lets it run under `bun test` with zero Neutralino runtime. `src/setup.ts` and `src/setup.DI.helpers.ts` import each other (circular by design — helpers need `GetDependency`, `setup.ts` needs `Construct_LocalMods`), so anything called eagerly at module top level in `setup.DI.helpers.ts` must not rely on that module's own top-level consts being initialized yet (see the comment above `Construct_LocalMods`).

## Persistence: two unrelated systems, don't conflate them

1. **`src/db/`** — the SQLite-backed "tracker" DB (deaths/dashes/sessions from `TheCelesteTracker-Mod`), queried through Kysely. `SqliteGoDialect.ts` is a custom Kysely dialect that shells out to the Go `Sqlite` binary (see below) instead of using a native SQLite driver. `CTDB` (`src/db/index.ts`) is a facade over one submodule per table (`src/db/submodules/*.ts`).
2. **`src/utils/Storage.ts` + `Storage.json.ts`** — a generic key/value cache over flat JSON files, unrelated to SQLite. `Storage` is a 2-tier cache (in-memory `Map` → pluggable `StorageAdapter[]`); `Storage_JsonFileAdapter` is one such adapter that mirrors a single JSON file into memory and **rewrites the entire file on every `set`/`remove`** (no partial writes — keep that in mind before caching something with a high write frequency).

   Two independent files use this pattern today:
   - `config.json` (repo root) — small app settings, via `src/domain/Configuration.ts`.
   - `data/mods-*.json` (four files, split out from a single `mods-dbS.json` to isolate high-frequency per-mod writes from the large rarely-changing blobs) — the local-mods cache, wired in `src/setup.DI.helpers.ts` (`Construct_LocalMods`):
     | File | Key(s) | Owning sub-manager |
     |---|---|---|
     | `mods-installed.json` | `localmods_allInstalled` | `LocalModsScanner` |
     | `mods-historical.json` | `LocalMods_HistoricalUninstalledMods` | `LocalModsHistoryManager` |
     | `mods-enrichment.json` | `LocalMods_Map_ModId_To_MaddiesInfo`, `LocalMods_Map_ModId_To_AuthorInfo` | `LocalModsMetadataEnricher` |
     | `mods-collectibletotals.json` | `localmods_collectibletotals:{modName}` — one key **per mod** | `LocalModsStatsCalculator` |

     A one-time migration (`MigrateLegacyCombinedFileIfNeeded` in `src/setup.DI.helpers.ts`) splits an old combined `mods-dbS.json` into these four on first run after upgrading; the old file is left in place afterward (harmless, unused).

## `DBMods` facade → 4 sub-managers

`DBMods` (`src/domain/LocalMods.ts`) is the public facade everything else calls (`EverestMods_GetAll`, `Mods_GetAllWithHistory`, `GetStatisticsByModId`, etc.). It composes 4 sub-managers under `src/domain/localmods/`, each owning its own storage key(s) and one concern:

- `LocalModsScanner` — scans installed mods via `Everest`, caches the raw Everest metadata.
- `LocalModsHistoryManager` — joins installed + recycle-bin ("ever played but uninstalled") mods; resolves categories.
- `LocalModsMetadataEnricher` — fetches/caches MaddiesAPI + GameBanana author info for installed mods.
- `LocalModsStatsCalculator` — computes gameplay statistics per mod from save-file XML + map `.bin` collectible totals (cached per mod, invalidated by zip size change).

Callers never touch these sub-managers or the `Storage` instances directly — only `DBMods`.

## `src/` subfolder map

| Folder | Purpose |
|---|---|
| `src/api/` | External API clients: `MaddiesAPI.ts` (primary mod metadata source), `GameBananaAPI.ts` (author info + fallback), `ImageCacheService.ts` (caches remote images to disk). |
| `src/core/` | The DI seam: `core/interfaces/` (`IFileSystem`, `IOs`, `IPath`, `IThread`, DI tokens) plus the production implementations (`NeutralinoFileSystem`, `NeutralinoOS`, `BrowserPath`, `ThreadBrowser`). Node/Bun equivalents live in `testing/helpers/`. |
| `src/db/` | SQLite tracker DB access (Kysely + `SqliteGoDialect`). |
| `src/domain/` | Core business logic: `Everest*.ts` (mod-scanning), `Olympus.ts`, `Celeste.ts`, `Configuration.ts`, `LocalMods.ts` + `domain/localmods/*` (see above). Universal-compatibility only — no browser/Neutralino imports. |
| `src/libs/` | Generic, Celeste-agnostic libraries meant to be standalone-publishable: `Wanvas/` (pan/zoom canvas widget system) and `GoldenLayoutThemes/` (Svelte wrapper/theming for `golden-layout`). |
| `src/pages/` | Route/pane components. `src/pages/panes/` holds what `NewPage.pageselector.svelte` can add as a golden-layout pane (`ModsSearch`, `ModView`, etc.); `src/pages/Main.svelte` hosts them. |
| `src/stores/` | Svelte 5 `$state`-based global stores (`*.store.svelte.ts`), self-initializing singletons — see `CLAUDE.md`'s "Global Svelte 5 Store Pattern". |
| `src/utils/` | Cross-cutting, domain-free helpers: `Storage.ts`/`Storage.json.ts`/`Storage.localStorage.ts`, `Logger.ts`, `AsyncLazy.ts`, `Hotkeys.ts`, `StringSimilarity.ts`. |

Entry point: `src/index.ts` → `neutralino.init()` → mounts `Loading.svelte` → waits for `ready` → ensures `./data` exists → `Configuration.initialize()` → mounts `src/index.svelte` (router outlet + `CommandCenter`).

## Go CLI helpers (native operations)

Three Go projects under `dependencies/`, invoked as child processes, JSON over stdout:

- `dependencies/Sqlite` — runs SQL against the tracker DB (`Sqlite_Go.ts` wrapper, sends `{"sql", "params"}` on stdin).
- `dependencies/CelesteModsParser` — mod ZIP/Everest scanning (`Zip_Go.ts` wrapper: `read`, `list`, `unzip`, `pack`, `scan-mods`).
- `dependencies/CelesteMapsBinParser` — map `.bin` collectible counting + room/map PNG rendering (`export-map`, `count-collectibles`).

`src-utils/Generic_Go.ts` resolves each binary's path by name; each has one thin TS wrapper class extending it. `dependencies/build.ts` compiles all three into `dependencies/build/` for local dev; `scripts/build.ts` does the same for production packaging.
