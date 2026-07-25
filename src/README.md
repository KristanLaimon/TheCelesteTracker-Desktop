# src/

Main application source for TheCelesteTrackerDesktop. Runs inside a **Neutralino** window (Chromium webview) — not Node.js, not Bun. The UI is Svelte 5, the backend services are wired with `tsyringe` DI, and all native operations (filesystem, OS APIs, SQLite, ZIP) go through platform abstractions defined in `src/core/interfaces/`.

## Architecture

```
Neutralino webview (Chromium)
    │
    ├── src/index.ts              ← entry point, mounts Svelte
    ├── src/index.svelte          ← root component, router outlet
    ├── src/router.svelte.ts      ← custom client-side router
    ├── src/router_setup.ts       ← route registration
    ├── src/setup.ts              ← production DI composition root
    │
    ├── src/core/                 ← platform abstraction (the DI seam)
    │   ├── interfaces/           ← IFileSystem, IOs, IPath, IThread, DependencyInjectionTokens
    │   ├── NeutralinoFileSystem.ts, NeutralinoOS.ts   ← Neutralino API wrappers
    │   └── BrowserPath.ts, ThreadBrowser.ts
    │
    ├── src/domain/               ← Celeste business logic
    │   ├── Everest.ts + Everest.{collabutils2,dialog,altsideshelper,worker}.ts
    │   └── Celeste.ts, Olympus.ts, LocalMods.ts, Configuration.ts
    │
    ├── src/api/                  ← online metadata sources
    │   └── GameBananaAPI.ts, MaddiesAPI.ts, ImageCacheService.ts
    │
    ├── src/db/                   ← app's own SQLite layer (CTDB facade + submodules/)
    │
    ├── src/utils/                ← domain-free helpers
    │   ├── Storage.ts + Storage.{json,localStorage}.ts  ← adapter key/value store
    │   └── Logger.ts, AsyncLazy.ts, StringSimilarity.ts, Hotkeys.ts
    │
    ├── src/libs/                 ← generic, publishable-as-npm libraries only
    │   ├── Wanvas/               ← canvas/whiteboard subsystem
    │   └── GoldenLayoutThemes/   ← golden-layout 2 integration
    │
    ├── src/pages/                ← Main.svelte + panes/ (golden-layout pane components)
    ├── src/components/           ← reusable Svelte components
    ├── src/layouts/              ← layout components (CenteredLayout)
    └── src/assets/               ← static assets (images, sprites)
```

## Dual runtime pattern

The app is designed to run in **two different environments** using the same codebase:

| Environment | Runtime | Interface implementations | Entry point |
|---|---|---|---|
| **Production** | Neutralino (Chromium webview) | `NeutralinoFileSystem`, `NeutralinoOS`, `BrowserPath`, `ThreadBrowser` | `src/index.ts` → `src/setup.ts` |
| **Tests** | Bun.js (headless) | `NodeJsFileSystem`, `NodeJsOS`, `NodeJsPath`, `BunThread` | `testing/setup.ts` |

The DI container (`tsyringe`) registers the appropriate implementations at startup. The app code never imports Neutralino APIs directly — it only depends on the interfaces. This is what makes testing possible without a window.

## Directory breakdown

A file's directory declares both its layer and its runtime constraint. `domain/`, `api/`, `db/`, `utils/` are `UNIVERSAL COMPATIBILITY` only — anything `BROWSER ONLY` belongs in `core/`, `components/`, `pages/`, `layouts/` or `libs/`. (`utils/Storage.localStorage.ts` is the single exception, and is marked as such.)

| Directory | Alias | Purpose |
|---|---|---|
| `core/` | `@core` | The DI seam. `core/interfaces/` holds the platform contracts — `IFileSystem` (file I/O), `IOS` (processes, env, dialogs), `IPath` (path manipulation), `IThread` (worker threads) — plus `DependencyInjectionTokens.ts`. The production implementations (`NeutralinoFileSystem`, `NeutralinoOS`, `BrowserPath`, `ThreadBrowser`) sit next to them; the Node.js/Bun ones live in `testing/`. |
| `domain/` | `@domain` | Celeste business logic: `Celeste` (save-file data), `Everest*` (mod scanning + metadata), `Olympus` (mod manager), `LocalMods` (installed + historical mod database), `Configuration` (app settings). |
| `api/` | `@api` | Online metadata sources and their image cache: `MaddiesAPI` (primary), `GameBananaAPI` (author info + fallback), `ImageCacheService`. |
| `db/` | `@db` | The app's own SQLite layer, typed with Kysely. `db.types.ts` (table interfaces + `Database`), `SqliteGoDialect.ts` (Kysely dialect over `Sqlite_Go`), and `CTDB` (`db/index.ts`) — a facade over one submodule per table in `db/submodules/`, plus `CTDB.Query` for cross-table queries. |
| `utils/` | `@utils` | Domain-free helpers: `Storage` (adapter-based key/value store with undo history) + its `json`/`localStorage` backends, `Logger`, `AsyncLazy`, `StringSimilarity`, `Hotkeys`. |
| `libs/` | `@libs` | Generic libraries only, written so they could ship as standalone npm packages: `Wanvas/` (infinite canvas/whiteboard) and `GoldenLayoutThemes/` (multi-pane window management). Nothing Celeste-specific. |
| `pages/` | `@pages` | Svelte 5 pages: `Main.svelte` (global window) and `panes/` — the components `NewPage.pageselector.svelte` offers as golden-layout panes (`Canvas`, `ModView`, `ModsSearch/`, `RawHtml`). |
| `components/` | `@components` | Reusable UI components: `CommandCenter.svelte` (keyboard command palette), `Loading.svelte` (boot screen), galleries, `SearchDynamic.svelte`. |
| `layouts/` | `@layouts` | Layout components, currently `CenteredLayout.svelte`. |
| `assets/` | `@assets` | Celeste-themed images — level logos, spritesheet icons, loading screens, GIFs. |

Aliases are declared in `tsconfig.json` (`compilerOptions.paths`, used by `tsc` and `bun test`) **and** `vite.config.ts` (`resolve.alias` — Vite does not read tsconfig paths). `@go` additionally points at `src-utils/`. Adding a bucket means adding the alias in both files.

Two rules for imports:
- Cross-bucket imports use the alias; imports inside the same bucket stay relative (`./Everest.dialog`).
- **`.svelte` imports stay relative even across buckets.** An alias-imported component makes vite-plugin-svelte miss its compiled-CSS cache, and `@tailwindcss/vite` then parses the raw component source as CSS and fails the build. Only `bun run build:frontend` catches this — `bun run check` will not.

## Key design decisions

- **No global state stores.** All state is local via Svelte 5 `$state()` runes. The `Router` singleton is the only global reactive state.
- **Custom router.** No router library — `router.svelte.ts` matches URL patterns with `:param` support and persists the last page to `localStorage`.
- **Platform abstraction via DI.** Every native API call goes through an interface. The same `Sqlite_Go` and `Zip_Go` wrappers from `src-utils/` work in both Neutralino and test environments because they depend on `IOS`/`IFileSystem`.
- **Command center.** `Ctrl+Shift+Z` opens a command palette for keyboard-driven navigation.
