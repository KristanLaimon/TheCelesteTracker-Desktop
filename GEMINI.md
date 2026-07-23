# GEMINI.md

TheCelesteTracker Desktop

TheCelesteTracker Desktop is *the* desktop all-in-one companion for Celeste PC Players (Modded and Vanilla players), the place-to-go to see all its local celeste info.

# CORE FEATURES (Non-negottiable but there are missing of implementation, so the program is done when app can do all of these features)
  - *Celeste + Priority Mod Support Gameplay Statistics*: 
    - _Real time statistics_: Shows current progress with graphs/tables/(or any way to show visually) history-runs about, with scoped stats (per campaign, chapter, room (#See '#Celeste Domain' for more info)) or global stats of the following.
      - Deaths
      - Dashes
      - Jumps
      - Minimum deaths
      - PlayTime
      - Content played: celeste vanilla campaign and mods campaigns (Full metadata, icons,
        images/screenshots/final screens)
      - Red Strawberries collected and pending (got/max)
      - Special Strawberries collected and pending to collect (got/max)
        (#See '#Celeste Domain' for more info):
        - Winged Golden Strawberry
        - Golden Strawberry / Silvers Strawberries
        - Platinum Strawberry
        - Moon strawberry
        - Timers Strawberries
          - Bronze timer strawberry
          - Silver timer strawberry
          - Gold timer strawberry
      - Hearts collected and pending to collect (got/max)
      - MiniHearts collected and pending to collect (got/max)
  - *Celeste & Priority Mods (campaigns && full-chapter) support visualization*:
    - _Pretty showcase of your installed mods and the ones you played at least one time (not currently installed, per campaign and per campaign/chapter):
      - Essential (offline mode):
        - Statistics (See previous point)
      - Not-so-essential-but-strongly-try-to-fech-desirable (online mode):
        - Cover image (1 or 0 images)
        - Additional screenshots (0..n images)
        - Description
        - Authors info:
          - Name
          - AvaterImage
          - Installed/Played mods related section (all the mods he created that you played once or currently installed)
  - *Common essential features*:
    - Search through your mods list (no matter if offline or online)
    - See current installed mods installed
      - Essential (whoule work at least in offline mode)
        - Filter by name
        - Filter by category
        - Filter by a specific stat (see Previous Stats point)
      - Not-so-essential-but-strongly-try-to-fech-desirable
        - Filter by author
        - Search throug mods with gallery view (using their cover img)


## Non-CORE features but STRONGLY IMPORTANT
  - *Unique feature: Free-Canvas (Custom-Made library for this proyect)*: 
    A canvas to pan and zoom with a widget-system, with the purpose to let the user
    to organize freely their stats in persistence different canvas, so they can insert images
    or have the satisfaction to see their stats in different ways than the rigid/customizable layouts
    imposed by the normal pages when displaying info from the last section:
      - *Celeste + Priority Mod Support Gameplay Statistics*
      - *Celeste & Priority Mods (campaigns && full-chapter) support visualization*
      - *Common essential features*
    With the following subfeatures in this unique feature:
      - Widgets:
        - Common/Generic:
          - Images
          - Texts
          - Wiring widget with arrows or lines
        - CelesteSpecific that derives from Common/Generic:
          - Mod info widget (with or without stats below section)
          - Mod Only Stats 
          - Mod Search bar
    All these with responsive-design. 
  - *Dashboard with highly customizable layouts (GoldenLayout but with custom-made svelte 5 wrapper)*:
    This allows user to have multiple subpages/tabs in the same global rendered pages, so user can have:
      - Canvas on the left
      - Mod statitics on the right-top
      - See all mods installed page on right-bottom
      - And so on

So for each unique feature, theres a custom-generic-library totally encapsulated from the app-celeste nature. They could
literally be published as npm packages, only generic public api, and usage in the rest of application. 
Currently the libs i've made is with:
  - Wanvas/Canvas -> *Unique feature: Free-Canvas (Custom-Made library for this proyect)*
  - GoldenLayoutWrapper -> *Dashboard with highly customizable layouts*

Keep them encapsulated with generic api, with ponytail skill if neccesary.


# Architecture and Dependencies
This companion app uses third-party well known software that normally assumes is installled in user. 
(Users are celeste players with modding playing experience)

# Mod Basic Scrapping;
  - Offline methods: 
    No internet required, but they provide the most basic info, so, ALWAYS USED as internal CORE-Information but almost never showed as-is in
    frontend due to lack of pretty-metadata like screenshots, author info, description, only very core-basic info, detailed in the following points:
    
      1. Everest installed: This are the main raw mod info sources (which this app scrapes). So this is the default metadata when offline mode, olympus has usefull metadata, but basic/raw, the high-overview info that can be scrapped is:
      ```json
        "Hyperline": {
          "fileName": "Hyperline.zip",
          "isZip": true,
          "modPath": "C:/Program Files (x86)/Steam/steamapps/common/Celeste/Mods/Hyperline.zip",
          "metadata": {
            "name": "Hyperline",
            "version": "0.3.10",
            "dll": "bin/Hyperline.dll",
            "dependencies": [
              {
                "name": "EverestCore",
                "version": "1.4673.0"
              }
            ],
            "optionalDependencies": [],
            "isLobby": false,
            "chapters": [],
            "campaigns": []
          },
          "humanName": "Hyperline"
        },
      ```

      2. Mod metadata online available -> MaddiesAPI, GameBanana API: This are the online metadata scrappers to improve mod metadata and even get images, author info an so on, because olympus/everest mods only is the mod itself, doesn't have much usefull metadata. ALWAYS make caching of this metadata when possible, we can't relay 100% in this apis ddue to offline user or reliability, (resiliance)


  3. Mod metadata offline available vanilla only (Very basic and only static final stats, not through time) -> this are found in C:\Program Files (x86)\Steam\steamapps\common\Celeste\Saves *Celste\Saves* folder (no matter the OS), and is a collection of .celeste files that in reality are .XML files with all the metadata.
  4. Mod metadata offline available with dependency mod created by me as well *https://github.com/KristanLaimon/TheCelesteTracker-Mod* A real-time gameplay tracking mod for Celeste (Everest). It monitors your progress, deaths, dashes, and level completions, storing everything in a local SQLite database and streaming events via WebSockets. Works for generic use, but built to feed the official 'TheCelesteTracker' client. I need to add documentation of this in this proyect. Features
📊 SQLite Persistence: Stores detailed run history, including per-room death counts, without bloating your game save.
🌐 Real-time WebSocket API: Streams gameplay events (dashes, deaths, transitions) to port 50500 (auto-hunting up to 50600).
🍓 Berry Tracking: Tracks strawberry counts per run.
🏆 PB Reference: Keeps quick access to your Personal Bests.
🗺️ Mod Support: Automatically identifies different campaigns (LevelSets) and custom maps.
  We know this mod is available and working when in *Celste\Saves* folder theres a database called `TheCelesteTracker_DB.db` (sqlite db). 
  If is available, we copy it (only if newer, use hashing) into this proyect resources (backup), but use the Celeste/saves folder db to query the through time metadata, (need to add schema documentation)

A mod could be any type of mod:
skin mod (players, entities)
map mod (which could be single map campaign or whole lobby, whose structure changes completely and always they use Collab Utils 2 mod, (so needs docs))
and other kind of mods that I need to get from codebase and document here

I need to organize my documentation dependencies!
Documentation Dependencies:
 1. Mod specifics:
    - Collab Utils 2: This is a mod when found in map mods with chapteres inside chapters (unique of mods using collab utils 2 mods)
      but this needs documentation, docuemntation found in Collab Utils 2.docs.md, 
    - Everest (Celeste mod loader): The wiki documentation is huge but only storing the ones refering to mods structure (so i can get inside the mods that normally can be zipped (always, when downloading are zips) or in folder (wwhen developing mods in local by me))
    - Alt Sides Helper: Not so common, but is frequent to find it in mods that have campaigns with chapters with a-side b-side c-side and that stuff.


## Personality & Values

- Terse, practical, ship-first. No abstractions "just in case." YAGNI is gospel — every abstraction/helper/config option must earn its keep.
- Standard library over new dependency. One line over fifty.
- No comments explaining what code does — code speaks for itself. JSDoc on public APIs fine.
- No emojis — not in code, docs, or commit messages.

## Non-Negotiables

- **NEVER remove `biome-ignore` comments.** They're there for a reason — ask if one looks stale.
- **Svelte 5 runes only.** `$state`, `$derived`, `$props`, `$effect`, `$bindable`. No Svelte 4 stores (`writable`/`readable`/`derived`). No slots — use `{#snippet}` + `{@render}`.
- **Bun only.** No npm/pnpm/yarn/npx. `bun install`, `bun run <script>`, `bun test`.
- Run `bun run lint` before and after changes (Biome auto-fixes). Run `bun run check` for type checking.
- PowerShell is the user's shell. WSL (Ubuntu) available for Linux-only commands.

## Commands

```bash
bun install               # installs deps, also runs `neu update` to fetch Neutralino binaries
bun run start              # run app in dev mode (Neutralino window + inspector)
bun run check              # svelte-check + tsc, no emit — run after any .ts/.svelte change
bun run lint               # biome check . --write --unsafe — auto-fixes, run before AND after changes
bun test                   # run all tests (Bun test runner, files in testing/*.test.ts)
bun test testing/Sqlite_Go_Usage.test.ts   # run a single test file
bun test -t "test name"    # run tests matching a name
bun run build              # full production build: Go CLI helpers -> neu build --embed-resources -> organize dist/prod/{windows,linux,mac}
bun run build:windows      # build script with --skip-linux
bun run build:frontend     # vite build only (frontend assets, no Neutralino packaging)
```

No dedicated e2e/playwright script in `package.json` — don't invent one.

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript 6 (strict mode) |
| UI | Svelte 5 (runes syntax) |
| Build | Vite 8 + `@sveltejs/vite-plugin-svelte` |
| Desktop | Neutralinojs 6 (not Electron) |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite` plugin, `@theme` directive in `index.css`) |
| DI | `tsyringe` (`@injectable()`, `@inject(Token)`, `container`) |
| Layout | `golden-layout` 2 (Svelte 5 wrapper) |
| Linter/Formatter | Biome 2 (replaces ESLint + Prettier) |
| Tests | Bun test runner (`bun test`, files in `/testing/`) |
| Package Manager | Bun |
| Native helpers | Go CLI (JSON over stdout for SQLite + ZIP) |

## Code Style

- Indent: tabs, width 2 (Biome rules, ignore `.editorconfig`)
- Quotes: single. Semicolons: required. Line width: 160. Trailing newline: yes.
- Naming:
  - `PascalCase` — classes, components, types, interfaces, files for components/classes
  - `camelCase` — functions, methods, variables, utility files
  - `SCREAMING_SNAKE_CASE` — constants
  - `I` prefix — interfaces (`IFileSystem`, `IOS`)
  - `_Token` suffix — DI token symbols (`IFileSystem_Token`)
- File names: `PascalCase.svelte`/`PascalCase.ts` for components/pages/layouts/classes; `camelCase.ts` for utilities/stores/constants; `kebab-case.*` for config files only.
- `interface` for object shapes with methods/extendable APIs; `type` for unions, intersections, mapped types, simple aliases.
- Imports order: externals, then relative project imports, then type-only (`import type`) — auto-organized by Biome on save. Prefer `import type` unless DI decorators need the value at runtime (then `// biome-ignore-all lint/style/useImportType`).

## Component Patterns (Svelte 5)

```svelte
<script lang="ts">
  // 1. imports
  // 2. local type definitions
  // 3. $props()
  // 4. $state()
  // 5. $derived() / $derived.by()
  // 6. $effect()
  // 7. functions / handlers
</script>

<!-- template -->

<style>
  /* scoped styles */
</style>
```

- Props type declared inline or as `type Props = {...}` before `$props()`.
- `$bindable()` for two-way binding props (e.g. canvas `x`, `y`, `zoom`).
- No `on:click` — Svelte 5 uses `onclick`.
- `{#key expr}` to force re-creation of components on route/state change.
- Transitions: `fade`, `fly` from `svelte/transition`.
- A11y warnings suppressed individually with `<!-- svelte-ignore a11y_... -->`.

## Styling

- Tailwind utility classes in templates for most styling; scoped `<style>` blocks for component-specific overrides.
- `:global()` only for third-party library theming.
- Dark theme: backgrounds `#05070f`, `#18181c`, `#242427`. Glassmorphism effects.
- CSS variables for theme tokens (`--font-*`, `--gl-*`).

## Testing

- `bun test` — files in `testing/*.test.ts`.
- Separate test DI setup in `testing/setup.ts` (`NodeJsFileSystem`, `NodeJsOS`, `BunThread`) — see Architecture below.
- `describe`/`test`/`expect` from `bun:test`. `{ timeout: N_MS }` for long-running integration tests.
- `GetDependency()` helper for DI-resolved service instances.

## Error Handling

- Try/catch with silent fallback — one mod's failure must not crash the whole scan.
- Log error (`Log_Error(...)`) then return default (null/empty) — don't throw on non-critical paths.
- Early return on null/undefined for non-critical paths.
- Throw only for critical precondition failures (smoke-test asserts).
- `Promise.allSettled` for batched API calls where partial failure is acceptable.

## Architecture

### Runtime-context header comments (load-bearing convention)

Nearly every file in `src/`, `src-utils/`, and `testing/` opens with one of:

```ts
// UNIVERSAL COMPATIBILITY
// BROWSER ONLY
// NODE.JS/BUN/DENO ONLY
```

States which runtime the file may run in. `UNIVERSAL COMPATIBILITY` files (most business logic, e.g. `src/libs/Everest.ts`, `src/CTDB/**`) must never import a browser-only or Neutralino-only API directly — they take platform capabilities through the `IFileSystem`/`IOS`/`IPath`/`IThread` interfaces instead. Keep this comment accurate when adding/moving files; it's what makes the DI-swap pattern below safe.

### Two DI containers, one interface set

Wired through `tsyringe`, with **two separate composition roots** registering the same interface tokens (`IFileSystem_Token`, `IOs_Token`, `IPath_Token`, `IThreadConstructor_Token` from `src/interfaces/DependencyInjectionTokens.ts`) against different concrete implementations:

- `src/setup.ts` — production root. Registers `NeutralinoFileSystem`, `NeutralinoOS`, `BrowserPath`, `ThreadBrowser`. Loaded only from `src/index.ts` (browser entry).
- `testing/setup.ts` — test root. Registers `NodeJsFileSystem`, `NodeJsOS`, `NodeJsPath`, `BunThread`. Loaded only from test files.

Business logic classes (`Everest`, `Celeste`, `Olympus`, `CTDB`, etc.) are written once against the interfaces and constructed identically in both roots — this lets domain logic run under `bun test` with zero Neutralino runtime. When adding a service touching filesystem/OS/threads: inject the interface/token, register the concrete class in **both** `setup.ts` files, never `new` up a `Neutralino*` class inside universal-compatibility code.

`src/setup.DI.helpers.ts` (`Construct_LocalMods`) shows building a fully-wired service graph outside the container for callers needing a custom `Storage` adapter stack.

### Go CLI helpers (native operations)

SQLite and ZIP work delegated to small Go binaries built from `src-utils/*.go`, invoked as child processes:

- `src-utils/main.go` / `sqlite.go` / `zip.go` — Go source, compiled per-OS by `src-utils/build.ts` into `bin/utilities-<os>_<arch>[.exe]`.
- `src-utils/Generic_Go.ts` — base class resolving the right binary path for the current OS via `IOS`/`IFileSystem`/`IPath`.
- `src-utils/Sqlite_Go.ts` / `src-utils/Zip_Go.ts` — TS wrappers that shell out to the binary, feed SQL/args via stdin, parse a `{success, ...}` JSON envelope from stdout.

New native-helper features should follow the same shape: one Go subcommand, one JSON envelope, one thin TS wrapper class extending `Generic_Go`. `testing/setup.ts` auto-builds the binary (`bun run build`) if missing before tests that need it run.

### Frontend structure

- `src/index.ts` — real entry point: `neutralino.init()`, mounts `Loading.svelte`, waits for `ready` event, ensures `./data` exists and local folders mounted, runs `Configuration.initialize()`, then mounts `src/index.svelte` (root component: router outlet + `CommandCenter`).
- `src/router.svelte.ts` / `router_setup.ts` — custom client-side router (no library), reactive via `$state`/`$derived.by`, persists last visited URL to `localStorage`.
- `src/CTDB/` — app's own SQLite-backed data layer. `CTDB` (`src/CTDB/index.ts`) is a thin facade composed of injectable submodules (`src/CTDB/submodules/*.ts`, e.g. `campaigns.ts`), each owning one table and talking to `Sqlite_Go` directly. New tables = new submodules, not growing an existing one.
- `src/libs/Everest*.ts` — mod-scanning domain logic (parses `everest.yaml`, `Meta.yaml`, `Dialog/English.txt`, collab-utils2 lobby structures, alt-sides-helper meta) from a mod folder or zip. Split by concern: `Everest.ts` (orchestration/types), `Everest.collabutils2.ts`, `Everest.dialog.ts`, `Everest.altsideshelper.ts`, `Everest.worker.ts`.
- `src/libs/Olympus.ts`, `LocalMods.ts` — reads locally-installed mod metadata (Olympus/Everest install) as offline metadata source.
- `src/libs/GameBananaAPI.ts`, `MaddiesAPI.ts` — online metadata/image enrichment sources; results cached (`ImageCacheService.ts`, `Storage*.ts`) since the app must stay usable offline and these APIs aren't guaranteed reliable.
- `src/libs/Storage.ts` + `Storage.json.ts` / `Storage.localStorage.ts` — small adapter-based key-value storage abstraction (pluggable persistence backends), not a state-management library.
- `src/libs/Wanvas/` and `Wanvas-Tabs/` — custom infinite canvas/whiteboard widget system (own math, persistence, widget types).
- `src/libs/GoldenLayoutThemes/` — Svelte wrapper/theming around `golden-layout` for the multi-pane window UI.

### Domain model (Celeste)

Player has one or more datasaves; a datasave tracks progress per campaign (vanilla Celeste counts as one campaign/mod). Campaign has 1..n chapters; collab-style mods (built on Collab Utils 2 — see `Collab Utils 2.docs.md`) additionally nest lobbies containing chapters. Vanilla static stats come from `.celeste` XML save files under Celeste's `Saves/` folder. Live/real-time stats (deaths, dashes, transitions per run) come from the companion mod [TheCelesteTracker-Mod](https://github.com/KristanLaimon/TheCelesteTracker-Mod), which writes its own SQLite DB into Celeste's `Saves/` folder and streams events over WebSocket (port 50500, scanning up to 50600) — this app reads/copies that DB rather than re-implementing tracking.

Reference docs worth checking before touching mod-parsing code: `docs/Database_TheCelesteDesktop.md` (schema), `docs/features/*.md` (feature specs), `Everest.docs.md`, `Collab Utils 2.docs.md`, `Alt Sides Helper.docs.md`.

## What I Like

Clean minimal no-bloat code; Svelte 5 runes (killed the store layer); custom implementations over frameworks (router, canvas, DI wiring); platform abstraction (`IFileSystem`/`IOS` swapping) for fast tests + lean production; Go CLI for native ops (tiny self-contained binaries, no Electron bloat); Biome over ESLint+Prettier; TypeScript strict mode catching slop before runtime; Golden Layout for multi-pane management; dark glassmorphism themes; JSON-over-stdout for child process communication.

## What I Don't Like

Svelte 4 stores; Electron; npm/pnpm; over-abstraction ("just in case we swap it later"); unnecessary dependencies; verbose boilerplate; comments explaining what instead of why; magic strings without constants when reused; huge PRs (one concern per commit); frameworks that fight you.
