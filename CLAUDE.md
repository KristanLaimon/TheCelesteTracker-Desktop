# CLAUDE.md

TheCelesteTracker Desktop

TheCelesteTracker Desktop is *the* desktop all-in-one companion for Celeste PC Players (Modded and Vanilla players), the place-to-go to see all its local celeste info and stats.

# Features & Roadmap
For the detailed roadmap of pending features to implement, see [TODO.md](.claude/TODO.md).

# Second Brain (IMPORTANT)
Non-business-rule learnings (process, tooling gotchas, dead ends) live as numbered `.claude/brain/NN-name.md` thought files, not here. This file stays business-rules-only. See `.claude/brain/01-second-brain-convention.md` for the workflow.


# TOKEN AND PERFORMANCE MANDATORY FLOWS
1. JSON Reading
  WHEN READING JSONS, FIRST COUNT THE NUMBER OF LINES THEY HAVE, if they have more than 1k lines, parse them using internal node.js json, read keys only and a little bit of each KEY values...  (to save TOKENS)

# Design.md
In case of creation of NEW SVELTE components LAZY-LOAD ONLY WHEN NEEDED the css colors style values in [Index CSS](./index.css) and [Design.md](.claude/DESIGN.md)

# Custom Generic Libraries & Encapsulation
For unique features, custom generic libraries are encapsulated cleanly from the Celeste domain logic (so they could be published as standalone npm packages with generic public APIs):
- `Wanvas/Canvas`: Free-Canvas pan & zoom widget system (`src/libs/Wanvas/`)
- `GoldenLayoutWrapper`: Dashboard with customizable layouts (`src/libs/GoldenLayoutThemes/`)

Keep these encapsulated with generic public APIs.


# Users Profile
Always assume Users could be: 
1. Celeste players with modding playing experience 
2. Celeste players with some experience (kinda new ones).
Do not assume users are complete new to the game, its rare for a newbie to install this companion app in the first place.

# Architecture and Optional-Dependencies
This companion app uses third-party well known software that could or not could be available in different envs:
(Globally installed)
- Everest 
- Olympus
(Used as dependency in specific mods)
- Alt Sides Helper (Mod) 
- Collab Utils 2
(Mod Installed)
- TheCelesteTrackerMod (other project of mine that creates a db in saves celeste folder)

that normally assumes is installed in user, but if not
installed, we need to handle it and show msg to user (any way, that, if the want a better experience in this companion app the should have them installed), but app should not crash.


# Celeste Domain (Specifics)

## Celeste installation
Celeste installation normally is found in:
- Windows: 
  - Stream Version Path: C:\Program Files (x86)\Steam\steamapps\common\Celeste\ for Steam or 
  - Microsoft Store version: %LOCALAPPDATA%\Packages\MattMakesGamesInc.Celeste_79daxvg0dq3v6\. (If installed from microsoft version, theres no mod support, so only celeste-vanilla content showing).
- MacOS: ~/Library/Application Support/Celeste/
- Linux: Could be located in 
  - If-Non-Steam-Version Path: ~/.local/share/Celeste/
  - Steam Version Path:, they're typically found in ~/.local/share/Steam/steamapps/common/Celeste/.Save 
  - Flatpak Stream Path: ~/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/common/Celeste/

Celeste saves the vanilla stats in /Saves or .Save folder (depending in OS)

In this dev environment: My celeste is installed in `C:\Program Files (x86)\Steam\steamapps\common\Celeste\`, take advantage of this to 
scrap by yourself if errors if you need it.

## Mod Indexing Sources:
On first startup or with manual user trigger, the scan is made with the following, ALWAYS doing local caching in
app resources folder ResourcesFolder/cache folder, to avoid re-scannings. 
  - Offline methods (always used): 
    No internet required, but they provide the most basic info, used as internal CORE-Information but almost never showed as-is in
    frontend due to lack of pretty-metadata like screenshots, author info, description ,etc.. . Only very core-basic info, detailed in the following points:

      1. Everest: This are the main raw mod info sources (which this app scrapes, but is VERY SLOW to SCAN due to .ZIP nature of mods). 
      This is a c# project using Monomod being, mod-injector only, (no GUI) that injects in the celeste folder, and normally adds the following in celeste folder:
        - Mods/: Here contains all the mods normally as zip
          - blacklist.txt
          - favorites.txt
          - modoptionsorder.txt
          - modpresets.txt
          - updaterblacklist.txt
      To see how everest stores metadata, LAZY-LOAD-ONLY IF NEEDED the documentation in: `./docs/Everest/**.md` files, only read them if needed, do not read them NOW for now but the TL;DR is:
      Everest stores very basic data as (note that DLL, and Optional Dependencies could or could not be there, load the everest docs with lazy-load-only as specified before):
      ```yaml
      - Name: StrawberryJam2021
        Version: 1.0.12
        DLL: Code/StrawberryJam2021.dll 
        Dependencies:
          - Name: Everest
            Version: 1.3847.0
          - ...
        OptionalDependencies:
          - Name: SpeedrunTool
            Version: 3.20.4
          - ...

      ```
      Currently at I have metadata full fetching (yaml and whole mod structure scanning) and returns a json like this, useful right? take as reference. More detailed doc LAZY-LOAD IF NEEDED in `./docs/TheCelesteDesktop/EverestMod_Berry143Map_FetchExample.json`, but for now the TL;DR is the following example:
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
      2. Olympus:
      This is a LOVE-Lua project with some dependencies in C#.
      I currently haven't found documentation about where is being installed in MacOS and linux, in windows, installation path is in:
      - `C:\Users\Kristan\AppData\Roaming\Olympus` only exes, no info
      And the information and important retrieving info is in:
      - `C:\Users\Kristan\AppData\Local\Olympus` with the following important files:
        - config.json
        - cached-mod-ids-to-names.json
        - cached-mod-ids-to-categories.json
        - loenn/:This project packages the most open-sourced celeste editor "LOENN" (another LOVE-LUA GUI app)
          - Lönn.exe  (executable)
      We could use this files if present, but normally i get this json-style-maps from the everest scrapping, but useful to know.

  ### On-disk `data/` resources folder (actual layout)
  Neutralino mounts a folder named `data/` next to the exe as `/data` (see `NeutralinoFileSystem.ResourcesFolderNameOnly`/`MountLocalFolders`), so its contents are fetchable from the frontend over HTTP, not just readable via filesystem APIs. Layout found there:
  - `data/mods-dbS.json`: the merged local-mods cache (Everest scan output + `LocalMods_Map_ModId_To_MaddiesInfo` keyed by mod id) that `LocalMods`/`Construct_LocalMods` reads and writes via `Storage_JsonFileAdapter`. Two top-level keys: `localmods_allInstalled` (raw per-mod Everest metadata, keyed by mod name) and `LocalMods_Map_ModId_To_MaddiesInfo` (MaddiesAPI enrichment, keyed by mod id). This file lives directly under `data/`, NOT under `data/cache/`.
  - `data/cache/modsscreenshots/` and `data/cache/avatars/`: only the actual binary image caches (mod screenshots, author avatars) fetched from GameBanana/Maddies, named `<gamebananaId>-<slug>-<index>.jpg`. Paths come from `Configuration.getModScreenshotsCachePath()`/`getAvatarsCachePath()`.
  - `config.json` (repo root, NOT under `data/`) is separate: small app-settings store (`dataFolderPath` override, etc.) read via `Configuration` class, defaults `dataFolderPath` to `./data` if unset.
  So "cache folder" in practice means image caches only — the JSON metadata cache sits one level up, directly in the resources root.

  - ONLINE METHODS:
    Only if connection to internet available, we're currently using 2 API Free providers:
    - MaddiesAPI: Found in `./src/libs/MaddiesAPI.ts`. Its a pretty basic and useful API, no docs needed that file is
      everything. Pretty simple. THIS IS THE MAIN ONLINE METHOD FOR Mod Metadata Scrapping / Indexing. No docs needed.
      This gets almost all the mod metaddata needed, except author full info.
    - GameBanana API: Found in `./src/libs/GameBananaAPI.ts`. More complex API and weird documented, if you need to modify
      this API ASK ME EXPLICITLY to give you the documentation you need, then create or append to `./src/docs/GameBananaAPI.docs.md` the info you learn about the api and/or the documentation I gave you.
      Currently this is used to get mods author FULL INFO only, and as a fallback for full mod metadata in case we have the modID (thanks to maddies api) and maddies api unavailable.
    
  So these are the online metadata scrappers available to improve mod metadata and even get images, author info an so on, because olympus/everest mods only is the mod itself, doesn't have much usefull metadata. ALWAYS make caching of this metadata when possible, we can't rely 100% on these apis due to user could be offline or reliability in APIs (and avoid over-using the apis and being banned or something). Resiliance and caching.



## Statistics Indexing 

- Vanilla + Mods (ever played) total statistics (Without using)

  Offline:
  1.  Only Last Save Total Snapshot (Without history-stats-backtracking) `ALWAYS AVAILABLE`: 
    Mod metadata offline available vanilla only (Very basic and only static final stats, not through time) -> this are found in C:\Program Files (x86)\Steam\steamapps\common\Celeste\Saves *Celeste\Saves* folder (no matter the OS), and is a collection of .celeste files that in reality are .XML files with all the metadata.
      - SPECIFICS:
        - Its one `N.celeste` file per save slot (0.celeste, 1.celeste, ...), and BOTH halves of "vanilla + mods ever played" live in that SAME file: vanilla campaign totals at the top (TotalDeaths, TotalStrawberries, TotalDashes, etc + per-chapter `<Areas>`), then every mod campaign ever played under `<LevelSets>` (still installed) or `<LevelSetRecycleBin>` (uninstalled since, stats kept, this is the "ever played" part). The `N-modsave-*.celeste` files (one per mod) are NOT for totals, thats per-mod extra data (flags, blacklists, in-progress session), not needed for this stats section.
        - LAZY-LOAD IF NEEDED a real trimmed example (actual field names/shape, from my own save) in `./docs/TheCelesteDesktop/SaveFile_VanillaAndModsTotalStats_Example.xml`, TL;DR: top-level `<TotalDeaths>`/`<TotalStrawberries>`/`<TotalDashes>`/etc are vanilla-only, mod totals gotta be summed by hand from `<LevelSetStats Name="...">` blocks (each has its own `<UnlockedAreas>`/`<TotalStrawberries>`/`<Areas>` with per-map `<AreaStats>`/`<AreaModeStats>` for deaths/time/best-time per side).

  2.  Stats through time, dynamically updated in real time when playing. (With History-Stats-Backtracking) `COULD O COULD NOT BE AVAILABLE`:
          Theres a dependency mod created by me (KristanLaimon) called `The Celeste Tracker Mod`
                        (*https://github.com/KristanLaimon/TheCelesteTracker-Mod*)
      Features
      - A real-time gameplay tracking mod for Celeste (Everest). It monitors your progress, deaths, dashes, and level completions, storing everything in a local SQLite database and streaming events via WebSockets. 
      - Works for generic use, but built to feed this companion app (Aka 'TheCelesteTracker') client.

      TL;DR:
        - 📊 Has SQLite Persistence: Stores detailed run history, including per-room death counts and much info.
        - 🌐 Real-time WebSocket API: Streams gameplay events (dashes, deaths, transitions) to port 50500 (auto-hunting up to 50600).
        - 🍓 Berry Tracking: Tracks strawberry counts per run.
        - 🗺️ Mod Support: Identify different campaigns (LevelSets) and custom maps.

      How do we know if its available?
      If in *\*/Celeste\Saves* folder theres a database called `TheCelesteTracker_DB.db` (sqlite db).  (Fixed name)

      Backups
      If db is available:
        1. We copy it (only if newer, use hashing) into this proyect resources /backup folder.
        2. We always use the Celeste/saves folder db to query the through time metadata.
      If db is not available in */Celeste/Saves/ folder && we have backup folder:
        1. We copy the last /backup database into *Celeste/Saves
        2. We always use the Celeste/save folder db to make our queries.
      If db is not available in #/Celeste/Saves/ folder && we do not have backup folder:
        1. We ask user to <optionally> install it, 2 ways:
          1.1 Manual install (giver full instructions in modal window or something) with steps to download it from github releases
          1.2 Automatic install (this app downloads it from github releases and put it in /Celeste/Mods folder) then ask to start celeste once, to initialize the db. (this app should be able to detect it in creation with a fileWatcher, only if user decided to install this, if cancels, stop the fileWatcher)

Player has one or more datasaves; a datasave tracks progress per campaign (vanilla Celeste counts as one campaign/mod). Campaign has 1..n chapters; collab-style mods (built on Collab Utils 2 — see `Collab Utils 2.docs.md`) additionally nest lobbies containing chapters. Vanilla static stats come from `.celeste` XML save files under Celeste's `Saves/` folder. Live/real-time stats (deaths, dashes, transitions per run) come from the companion mod [TheCelesteTracker-Mod](https://github.com/KristanLaimon/TheCelesteTracker-Mod), which writes its own SQLite DB into Celeste's `Saves/` folder and streams events over WebSocket (port 50500, scanning up to 50600) — this app reads/copies that DB rather than re-implementing tracking.

Reference docs worth checking before touching mod-parsing code: `docs/Database_TheCelesteDesktop.md` (schema), `docs/features/*.md` (feature specs), `Everest.docs.md`, `Collab Utils 2.docs.md`, `Alt Sides Helper.docs.md`, `docs/TheCelesteDesktop/CelesteMapBin_Format.md` (map `.bin` BinaryPacker layout — the only source of collectible *maximums*, since saves record only what was collected) and `docs/TheCelesteDesktop/CelesteMapBin_Quirks_And_ModPatterns.md` (what real mods put in their maps: entity-name census, deny list, trailing-byte quirk).

-- HERE FINISHED MY HUMAN WRITING DO NOT MODIFY ANY PREVIOUS TEXT, ONLY FROM HERE FORWARD --
## Celeste Mod Domain
A mod could be any type of mod like:
  - Assets
  - Effects
  - Helpers
  - Maps (is Special: Could be simple or with alt sides or lobby-collab mod, no sure if could be alt sides + lobby-collab mod, I've never seen it in 2-3 years of celeste modding experience)
  - Mechanics
  - Other/Misc
  - Skins
  - Tools
  - UI
  - WiPs
  - No category

### Mod database: installed + historical (uninstalled) mods

`DBMods.Mods_GetAllWithHistory()` (`src/libs/LocalMods.ts`) is the canonical "every mod this player has or has had" API — don't re-derive this join elsewhere. It combines:
- Tier 1 (cheap, common case): mods already in the cached Everest scan (`EverestMods_GetAll`), split by a fresh `fs.exists(modPath)` check — catches uninstalls the scan cache doesn't know about yet without a full re-scan.
- Tier 2 (fallback, Storage-cached via `HistoricalMods_GetAll`): mods the scan cache never saw at all, recovered from save files' `<LevelSetRecycleBin>`.

Key domain fact: a save file's `LevelSetStats Name` is **not** guaranteed to equal the mod's real Everest id (`everest.yaml` `Name`). For an installed/cached mod it's derived via `GetLevelSetNamesForMod()` (`src/libs/Everest.ts`) — `campaigns[].campaignNameId` for standalone mods, `${collabId}/${lobbyId}` for collab mods. For a mod known *only* via the recycle bin (uninstalled before this app ever scanned it), there's nothing left to cross-check against — it's identified best-effort by the first `/`-segment of the raw `LevelSetStats Name`, with `modNameId: null` marking it as unresolved.

Category resolution (`DBMods.ResolveModCategory`) is Olympus (offline) first, Maddies' online `CategoryName` as a last-resort fallback only when Olympus isn't installed at all — never per-mod-missing-entry fallback. Returns `null` (never throws) if neither resolves; callers decide what "uncategorized" means to them.

`DBMods.GetStatisticsByModId(modId, opts)` (`src/domain/LocalMods.ts`) is the canonical API for retrieving all global and campaign/lobby/chapter basic statistics (deaths, playtime, red strawberries, special berries, hearts, mini-hearts) strictly from static `.celeste` XML save files for a required `opts.saveSlot` (0-indexed). It returns a discriminated union `ModStatisticsResult` (`VanillaModStatisticsResult` | `LobbyModStatisticsResult` | `StandaloneModStatisticsResult`) tagged by `isVanilla` and `isLobbyMod`. `saveWideDashes` and `saveWideJumps` live at the result root, representing total dashes and jumps across all campaigns and installed mods in that save slot (from top-level `<TotalDashes>` / `<TotalJumps>`). `ChapterSideStats.berriesCollected` reports red-only strawberries (`min(count, maxRed)`). For Vanilla Celeste (`isVanilla: true`), `specialStrawberries` strictly contains `golden`, `moon`, and `wingedGolden`. Unplayed or non-existent sides (such as B/C sides on Prologue, Epilogue, and Farewell) are omitted from `chapter.sides`. Total vanilla Celeste berries = 202 (175 red, 25 golden, 1 winged golden, 1 moonberry; 24 crystal hearts).

### Special Direct Support for this specific mods in this project

1. Collab Utils 2: 
  TL;DR: It's a mod that add some entities and features that are useful for collabs
    - Chapter Panel and Journal Triggers
    - Mini Hearts
    - Mini Heart Doors
    - Silver Berries
    - Speedberries
  Prefer this: Local documentation downloaded in: `./src/docs/EverestSpecificModsSupport/Collab Utils2.docs.md` ONLY LAZY-LOAD IT WHEN YOU NEEDED, DO NOT LOAD IT BY NOW.
  In case of heavy doubts -> OnlineLink: https://github.com/EverestAPI/CelesteCollabUtils2
  In case of heavy doubts -> OnlineDocumentation: https://raw.githubusercontent.com/EverestAPI/CelesteCollabUtils2/refs/heads/master/DOCUMENTATION.md

2. Alt Sides Helper
   TL;DR: It's a mod that allows you to add: 
    - Extra 'sides to your map - whether they be 
      - D-Sides
      - Heartsides
      - CC-Sides
      - Gyms
      and display them in the same way as vanilla's B and C sides. It also provides some assets for D-Sides.
  Prefer this: Local documentation downloaded in `./src/docs/EverestSpecificModsSupport/Alt Sides Helper.docs.md`. ONLY LAZY-LOAD IT WHEN YOU NEEDED, DO NOT LOAD IT BY NOW.
  In case of heavy doubts -> OnlineLink: https://github.com/l-Luna/AltSidesHelper
  In case of heavy doubts -> OnlineDocumentation: https://raw.githubusercontent.com/l-Luna/AltSidesHelper/refs/heads/interrim/DOCUMENTATION.md

# CODING

## STACK

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
| Package Manager | Bun (NEVER NPM, no pnpm, no yarn, NPX FORBIDDEN) |
| Native helpers | Go CLI (JSON over stdout for SQLite + ZIP) |
| Icons | `flowbite-svelte-icons` |

## Non-Negotiables
  - **NEVER remove `biome-ignore` comments.** They're there for a reason — ask if one looks stale.
  - Terse, practical, ship-first. No abstractions "just in case." YAGNI is gospel — every abstraction/helper/config option must earn its keep.
  - Standard library over new dependency. One line over fifty.
  - No comments explaining what code does — code speaks for itself, jsDocs are fine. JSDoc on public APIs are mandatory.
  - No emojis — not in code, docs, or commit messages.
  - **Svelte 5 runes only.** `$state`, `$derived`, `$props`, `$effect`, `$bindable`. No Svelte 4 stores (`writable`/`readable`/`derived`). No slots — use `{#snippet}` + `{@render}`.
  - **Bun only.** No npm/pnpm/yarn/npx. `bun install`, `bun run <script>`, `bun test`.
  - Run `bun run lint:fix` before and after changes (auto-fixes; `bun run lint` alone is check-only, no `--write`). Run `bun run check` for type checking.
  - PowerShell is the user's shell. WSL (Ubuntu) available for Linux-only commands.


## Scripts available
- BUN AS PACKAGE MANAGER. NPX AND NPM FORBIDDEN.
- FORBIDDEN COMMANDS TO EXECUTE BY YOU EXCEPT UNLESS EXPLICITLY ASKED BY USER IN PROMPT.
  ```bash
    bun x neu update # To fetch neutralino binaries. Almost NEVER NEEDED. Its a one-time command for whole dev project after clonning.
    bun install               # installs deps, also runs `neu update` to fetch Neutralino binaries
    bun run start              # You have no permission to start it, assume the dev is the one who can start it ONLY. UNLESS EXPLICITLY ASKED BY USER IN PROMPT.
    bun run check              # svelte-check + tsc, no emit — run after any .ts/.svelte change
    bun run lint               # biome check . — check only, no fixes
    bun run lint:fix           # biome check . --write --unsafe — auto-fixes, run before AND after changes
    bun test testing/go-utils-tests/Sqlite_Go_Usage.test.ts   # run a single test file
    bun test -t "test name"    # run tests matching a name
    bun run build              # full production build: Go CLI helpers -> neu build --embed-resources -> organize dist/prod/{windows,linux,mac}
    bun run build:frontend     # vite build only (frontend assets, no Neutralino packaging)
  ```
- COMMANDS TO EXECUTE AFTER CHANGES, IF WARNINGS | ERRORS, FIX ITERATE UNTIL ALL FIXED.
  ```bash
    1. bun test                   # run all tests (Bun test runner, files in testing/**/*.test.ts)
    2. bun check
    3. bun lint:fix
    4. bun check # (to check if lint:fix didn't broke anything)
  ```

## Git Workflow

- When implementing a multi-part plan (several distinct features/files), commit one logical part per feature — not one giant commit. Each commit should pass `bun run check` + relevant tests on its own.
- Commit body format: bullet list, one line per change, not prose paragraphs.
  ```
  feat(scope): short summary line

  - change 1: short description
  - change 2: short description

  Co-Authored-By: <currentAiModel>  <noreply@mail.com>
  ```


## Code Style

The frontend deliberately borrows C# OOP conventions rather than idiomatic functional TS:

| Element | Convention | Example |
|---|---|---|
| Classes | `PascalCase` | `AuthStore` |
| Class private fields/methods | `#camelCase` | `#loginAttempts`, `#startBanTimer()` |
| Public class methods | `PascalCase` | `Login()`, `SignIn()` |
| Standalone functions | `camelCase` | `handleSubmit()` |
| Svelte stores/singletons | `PascalCase` exported const | `export const AuthStore` |
| Types | `PascalCase`, domain-prefixed | `API_Workspace_GET_Response` |
| Local variables | `camelCase` | `errorMessage` |
| Constants | `UPPER_SNAKE_CASE` | `CODE_LENGTH` |

More conventions:
- Interfaces: `I` prefix (`IFileSystem`, `IOS`)
- `_Token` suffix — DI token symbols (`IFileSystem_Token`)
- Indent: tabs, width 2 | Source of truth config hierarchy: .editorconfig > biome.json (configured to use .editorconfig)
- Quotes: double. 
- Semicolons: required. 
- Line width: 160. 
- Trailing newline: yes.
- `kebab-case.*` for config files only.
- `interface` for object shapes with methods/extendable APIs; 
- `type` for unions, intersections, mapped types, simple aliases.
- Prefer `import type` unless DI decorators need the value at runtime (then `// biome-ignore-all lint/style/useImportType: <Explanation>` at top of the file command).
- **Options Object Pattern**: Never use raw positional boolean flags in function/method signatures (e.g. `get(forceRefresh?: boolean)`). Always use a named options object parameter (e.g. `get(opts?: { forceRefresh?: boolean })`) for self-documenting, extensible code.

## Global Svelte 5 Store Pattern (`*.store.svelte.ts`)

Global stores manage application-wide state using Svelte 5 `$state` runes:
1. **Self-Contained Class**: Store class is defined as an unexported class within `*.store.svelte.ts` (e.g. `class SaveSlotStore`).
2. **Self-Initializing Constructor**: The constructor automatically invokes its own async `Initialize()` method (fetching services via `GetDependency(...)`). Outside UI components MUST NOT be responsible for initializing global stores.
3. **Reactive `$state` Fields & OOP Methods**: Public state fields use `$state` (e.g., `public selectedSaveSlot = $state<number>(0);`), and public methods use C# `PascalCase` (e.g. `SetSelectedSaveSlot(slot: number)`).
4. **Default Export Instance**: The class is instantiated in the store file and exported as default (`const saveSlotStore = new SaveSlotStore(); export default saveSlotStore;`).
5. **Consumption**: UI components simply import the store (`import saveSlotStore from "..."`), read properties directly, and invoke mutation methods; Svelte 5 fine-grained reactivity automatically handles updates across the app.


## PREFERRED Component Patterns (Svelte 5)

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
- `$bindable()` for two-way binding props configurable (e.g. canvas `x`, `y`, `zoom`) (Used a lot for public api props for svelte mini library files).
- No `on:click` — Svelte 5 uses `onclick` and so on.
- `{#key expr}` to force re-creation of components on route/state change.
- A11y warnings suppressed individually with `<!-- svelte-ignore a11y_... -->`.

## Styling

- Tailwind utility classes in templates for most styling; scoped `<style>` blocks for component-specific overrides.
- `:global()` only for third-party library theming.
- Dark theme: backgrounds `#05070f`, `#18181c`, `#242427`. Glassmorphism effects.
- CSS variables for theme tokens (`--font-*`, `--gl-*`).

## Testing

- `bun test` — files in `testing/**/*.test.ts`.
- Separate test DI setup in `testing/setup.ts` (`NodeJsFileSystem`, `NodeJsOS`, `BunThread`) — see Architecture below.
- `describe`/`test`/`expect` from `bun:test`. `{ timeout: N_MS }` for long-running integration tests.
- `GetDependency()` helper for DI-resolved service instances.

## Error Handling

- Try/catch with silent fallback — one mod's failure must not crash the whole scan.
- Log error (`logger.error(...)`) then return default (null/empty) — don't throw on non-critical paths.
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

States which runtime the file may run in. 
- `UNIVERSAL COMPATIBILITY` files (most business logic, e.g. `src/domain/Everest.ts`, `src/db/**`) must never import a browser-only or Neutralino-only API directly — they take platform capabilities through the `IFileSystem`/`IOS`/`IPath`/`IThread` interfaces instead. Keep this comment accurate when adding/moving files; it's what makes the DI-swap pattern below safe.

### Two DI containers, one interface set

Wired through `tsyringe`, with **two separate composition roots** registering the same interface tokens (`IFileSystem_Token`, `IOs_Token`, `IPath_Token`, `IThreadConstructor_Token` from `src/core/interfaces/DependencyInjectionTokens.ts`) against different concrete implementations:

- `src/setup.ts` — production root. Registers `NeutralinoFileSystem`, `NeutralinoOS`, `BrowserPath`, `ThreadBrowser`. Loaded only from `src/index.ts` (browser entry).
- `testing/setup.ts` — test root. Registers `NodeJsFileSystem`, `NodeJsOS`, `NodeJsPath`, `BunThread`. Loaded only from test files.

Business logic classes (`Everest`, `Celeste`, `Olympus`, `CTDB`, etc.) are written once against the interfaces and constructed identically in both roots — this lets domain logic run under `bun test` with zero Neutralino runtime. When adding a service touching filesystem/OS/threads: inject the interface/token, register the concrete class in **both** `setup.ts` files, never `new` up a `Neutralino*` class inside universal-compatibility code.

`src/setup.DI.helpers.ts` (`Construct_LocalMods`) shows building a fully-wired service graph outside the container for callers needing a custom `Storage` adapter stack.

### Go CLI helpers (native operations)

SQLite and ZIP work delegated to small Go binaries built from `src-utils/*.go`, invoked as child processes:

- `src-utils/main.go` / `sqlite.go` / `zip.go` — Go source, compiled per-OS by `src-utils/build.ts` into `bin/utilities-<os>_<arch>[.exe]`.
- `src-utils/Generic_Go.ts` — base class resolving the right binary path for the current OS via `IOS`/`IFileSystem`/`IPath`.
- `src-utils/Sqlite_Go.ts` / `src-utils/Zip_Go.ts` — TS wrappers that shell out to the binary, feed SQL/args via stdin, parse a `{success, ...}` JSON envelope from stdout. `Sqlite_Go` sends `{"sql": ..., "params": [...]}` on stdin so values are bound by SQLite instead of interpolated; a raw SQL string on stdin still works. One call = one process = one connection, so no transactions/temp tables/PRAGMA state across statements.

New native-helper features should follow the same shape: one Go subcommand, one JSON envelope, one thin TS wrapper class extending `Generic_Go`. `testing/setup.ts` auto-builds the binary (`bun run build`) if missing before tests that need it run.

### Frontend structure

`src/` is bucketed by layer, and the bucket a file sits in declares its runtime constraint. `src/domain/`, `src/api/`, `src/db/`, `src/utils/` are UNIVERSAL COMPATIBILITY only — anything BROWSER ONLY belongs in `src/core/`, `src/components/`, `src/pages/`, `src/layouts/` or `src/libs/`. (`src/utils/Storage.localStorage.ts` is the single BROWSER ONLY exception living in `utils/`.)

- `src/index.ts` — real entry point: `neutralino.init()`, mounts `Loading.svelte`, waits for `ready` event, ensures `./data` exists and local folders mounted, runs `Configuration.initialize()`, then mounts `src/index.svelte` (root component: router outlet + `CommandCenter`).
- `src/router.svelte.ts` / `router_setup.ts` — custom client-side router (no library), reactive via `$state`/`$derived.by`, persists last visited URL to `localStorage`.
- `src/core/` — the DI seam. `core/interfaces/` holds `IFileSystem`/`IOs`/`IPath`/`IThread` + `DependencyInjectionTokens.ts`; alongside them sit the production implementations `NeutralinoFileSystem`, `NeutralinoOS`, `BrowserPath`, `ThreadBrowser`. The Node/Bun implementations live in `testing/`.
- `src/db/` — app's own SQLite-backed data layer, queried through Kysely. `db.types.ts` holds the table interfaces + the `Database` schema type; `SqliteGoDialect.ts` is the custom Kysely dialect running compiled SQL through `Sqlite_Go` (and `CreateTrackerDb()`, registered under `Kysely_Token` in both composition roots). `CTDB` (`src/db/index.ts`) is a thin facade over one injectable submodule per table (`src/db/submodules/*.ts`, all extending `_base.ts` for `GetAll()`/`Table()`), plus `CTDB.Query` for cross-table work. New tables = new submodule + new entry in `Database`, not growing an existing one. No transactions — see the dialect's error message.
- `src/domain/Everest*.ts` — mod-scanning domain logic (parses `everest.yaml`, `Meta.yaml`, `Dialog/English.txt`, collab-utils2 lobby structures, alt-sides-helper meta) from a mod folder or zip. Split by concern: `Everest.ts` (orchestration/types), `Everest.collabutils2.ts`, `Everest.dialog.ts`, `Everest.altsideshelper.ts`, `Everest.worker.ts`.
- `src/domain/Olympus.ts`, `LocalMods.ts`, `Celeste.ts`, `Configuration.ts` — reads locally-installed mod metadata (Olympus/Everest install) and Celeste save data as offline sources.
- `src/api/GameBananaAPI.ts`, `MaddiesAPI.ts` — online metadata/image enrichment sources; results cached (`src/api/ImageCacheService.ts`, `src/utils/Storage*.ts`) since the app must stay usable offline and these APIs aren't guaranteed reliable.
- `src/utils/Storage.ts` + `Storage.json.ts` / `Storage.localStorage.ts` — small adapter-based key-value storage abstraction (pluggable persistence backends), not a state-management library. `Logger`, `AsyncLazy`, `StringSimilarity`, `Hotkeys` share the bucket: domain-free helpers only.
- `src/libs/` — generic libraries only, publishable as standalone npm packages: `Wanvas/` (custom infinite canvas/whiteboard widget system, own math/persistence/widget types) and `GoldenLayoutThemes/` (Svelte wrapper/theming around `golden-layout` for the multi-pane window UI). Nothing Celeste-specific goes here.
- `src/pages/panes/` — the components `NewPage.pageselector.svelte` offers as golden-layout panes; `src/pages/Main.svelte` is the window that hosts them.

### Imports

All internal imports in the codebase use standard relative paths (e.g. `./` or `../`). Path aliases (`@core`, `@domain`, `@utils`, etc.) and `compilerOptions.paths` / `vite.config.ts` alias entries are completely removed to maintain clean, unambiguous resolution across `tsc`, `bun test`, Vite, and Svelte plugins.



## What I Like

Clean minimal no-bloat code; Svelte 5 runes (killed the store layer); custom implementations over frameworks (router, canvas, DI wiring); platform abstraction (`IFileSystem`/`IOS` swapping) for fast tests + lean production; Go CLI for native ops (tiny self-contained binaries, no Electron bloat); Biome over ESLint+Prettier; TypeScript strict mode catching slop before runtime; Golden Layout for multi-pane management; dark glassmorphism themes; JSON-over-stdout for child process communication.

## What I Don't Like

Svelte 4 stores; Electron; npm/pnpm; over-abstraction ("just in case we swap it later"); unnecessary dependencies; verbose boilerplate; comments explaining what instead of why; magic strings without constants when reused; huge PRs (one concern per commit); frameworks that fight you.

