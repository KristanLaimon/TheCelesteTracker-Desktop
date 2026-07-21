# src/

Main application source for TheCelesteTrackerDesktop. Runs inside a **Neutralino** window (Chromium webview) — not Node.js, not Bun. The UI is Svelte 5, the backend services are wired with `tsyringe` DI, and all native operations (filesystem, OS APIs, SQLite, ZIP) go through platform abstractions defined in `src/interfaces/`.

## Architecture

```
Neutralino webview (Chromium)
    │
    ├── src/index.ts              ← entry point, mounts Svelte
    ├── src/index.svelte          ← root component, router outlet
    │
    ├── src/router.svelte.ts      ← custom client-side router
    ├── src/router_setup.ts       ← route registration
    │
    ├── src/pages/                ← page components (Main, InstalledMods, ModView)
    ├── src/components/           ← reusable Svelte components
    ├── src/layouts/              ← layout components (CenteredLayout)
    │
    ├── src/libs/                 ← services, utilities
    │   ├── Celeste.ts, Everest.ts, Olympus.ts  ← core logic
    │   ├── NeutralinoFileSystem.ts / NeutralinoOS.ts  ← Neutralino API wrappers
    │   ├── Storage.ts            ← layered key/value store with undo history
    │   ├── Wanvas/               ← canvas/whiteboard subsystem
    │   ├── GoldenLayoutThemes/   ← golden-layout 2 integration
    │   └── ...
    │
    ├── src/interfaces/           ← platform abstraction contracts
    │   ├── IFileSystem.ts, IOs.ts, IPath.ts, IThread.ts
    │   └── DependencyInjectionTokens.ts  ← DI symbol tokens
    │
    ├── src/CTDB/                 ← database types + service layer
    └── src/assets/               ← static assets (images, sprites)
```

## Dual runtime pattern

The app is designed to run in **two different environments** using the same codebase:

| Environment | Runtime | Interface implementations | Entry point |
|---|---|---|---|
| **Production** | Neutralino (Chromium webview) | `NeutralinoFileSystem`, `NeutralinoOS`, `BrowserPath`, `ThreadBrowser` | `src/index.ts` → `src/setup.ts` |
| **Tests** | Bun.js (headless) | `NodeJsFileSystem`, `NodeJsOS`, `NodePath`, `BunThread` | `testing/setup.ts` |

The DI container (`tsyringe`) registers the appropriate implementations at startup. The app code never imports Neutralino APIs directly — it only depends on the interfaces. This is what makes testing possible without a window.

## Directory breakdown

| Directory | Purpose |
|---|---|
| `interfaces/` | Platform abstraction contracts: `IFileSystem` (file I/O), `IOS` (processes, env, dialogs), `IPath` (path manipulation), `IThread` (worker threads). Each has a Neutralino implementation in `libs/` and a Node.js implementation in `testing/`. |
| `libs/` | All business logic and services: `Celeste` (Celeste game data), `Everest` (mod scanning + metadata), `Olympus` (mod manager), `Storage` (layered key/value store with undo history), `Logger`, `Hotkeys`, `GameBananaAPI`, `MaddiesAPI`. Also contains the `Wanvas` canvas subsystem and `GoldenLayoutThemes` for multi-pane window management. |
| `CTDB/` | Database service layer with SQLite-backed types (`User`, `Campaign`, `Chapter`, `ChapterSide`, etc.) and submodule services. |
| `pages/` | Svelte 5 page components: `Main.svelte` (global window), `InstalledMods.svelte` (mod list), `ModView.svelte` (mod details). |
| `components/` | Reusable UI components: `CommandCenter.svelte` (keyboard command palette), `Loading.svelte` (boot loading screen). |
| `layouts/` | Layout components, currently `CenteredLayout.svelte`. |
| `assets/` | Celeste-themed images — level logos, spritesheet icons, loading screens, GIFs. |

## Key design decisions

- **No global state stores.** All state is local via Svelte 5 `$state()` runes. The `Router` singleton is the only global reactive state.
- **Custom router.** No router library — `router.svelte.ts` matches URL patterns with `:param` support and persists the last page to `localStorage`.
- **Platform abstraction via DI.** Every native API call goes through an interface. The same `Sqlite_Go` and `Zip_Go` wrappers from `src-utils/` work in both Neutralino and test environments because they depend on `IOS`/`IFileSystem`.
- **Command center.** `Ctrl+Shift+Z` opens a command palette for keyboard-driven navigation.
