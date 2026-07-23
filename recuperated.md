

TheCelesteTracker Desktop

TheCelesteTracker Desktop is *the* high-performance desktop all-in-one companion for Celeste PC Players (Modded and Vanilla players). 
  - *Celeste Gameplay Statistics*: 
  - *Not in real time statistics fetching*: If not live, captures


app will have offline mode and online mode

## Architecture/Dependencies
The project depends on the following to fetch correctly all data:
Mod info / metatada:
  1. Mod metadata offline available ->Olympus/Everest installed, this are the main raw mod info sources (which this app scrapes). So this is the default metadata when offline mode, olympus has usefull metadata, but basic/raw.
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



# Celeste 
Celeste keeps the info of player as datasaves
- A Player can have multiple datasaves
- A data saves have multiple campaigns info progress (thanks to mods but only 1 if vanilla) (celeste, glyph, strawberryjam2021) (assume celeste as vanilla "mod" simple campaign)
- A single campaign can have 1..n chapters (a chapter is a level and thats it), but a single campaign can have also 1..n chapters and this chappters have 1..n chapters (only lobby complete-feature mods like Spring collab, strawberryjam collab, etc, this are unique mods exceptions)





The project follows a decoupled, performance-oriented architecture:
- **Lightweight Desktop Shell**: Uses Neutralinojs instead of Electron to drastically optimize the final binary size and RAM memory consumption.
- **Modern Svelte 5 Frontend**: Implemented entirely with Svelte 5 and its Runes system ($state, $derived, $props, $effect, $bindable) to eliminate global store-based reactivity. It features a custom client-side router (src/router.svelte.ts) and a custom integration with Golden Layout for advanced multi-pane and window management.
- **Dependency Injection (DI)**: Managed via tsyringe to enable system decoupling through interfaces (IFileSystem, IOS, IThread). This allows for fast mocking in unit and integration tests (using Node.js/Bun) while injecting native Neutralinojs APIs in production.
- **Native Helpers (Go CLI)**: Native operations requiring high performance or operating system APIs (such as the SQLite database and ZIP compression) are delegated to small Go binaries that communicate with the frontend by sending JSON via stdout.
- **Initial Progress Import**: Performs an initial bootstrapping and scanning process to import historical progress stored in Celeste save files (e.g., N.celeste and N-modsavedata.celeste) and associate it with the local database.

## Stack Used
- **Package Manager**: Bun (runtime environment and dev tooling).
- **Language**: TypeScript 6 (in strict mode).
- **UI Framework**: Svelte 5 (Runes syntax).
- **Bundler / Compiler**: Vite 8 + @sveltejs/vite-plugin-svelte.
- **Desktop Shell**: Neutralinojs 6.
- **Design & Styling**: Tailwind CSS 4 (@tailwindcss/vite plugin and @theme directive in index.css).
- **Dependency Injection**: tsyringe.
- **Layout**: Golden Layout 2 (Svelte 5 wrapper).
- **Linter & Formatter**: Biome 2 (replacing ESLint and Prettier).
- **Test Runner**: Bun test runner (test files in testing/).
- **Native Helpers**: Go CLI.

## Preferences and Tastes
Project development is governed by the following author principles and preferences:
- **Likes**:
  - Clean, direct, minimal code free of premature abstractions (YAGNI is law).
  - Preference for the standard library over adding third-party dependencies.
  - Svelte 5 Runes for reactivity, completely avoiding the global Svelte 4 store layer.
  - Custom implementations (like the custom router and dependency injection) to avoid heavy frameworks.
  - Clear platform abstractions that facilitate fast testing.
  - Self-contained Go native helpers debuggable via JSON over stdout.
  - Biome as a single, fast tool for formatting and linting.
  - Sleek dark themes with glassmorphism effects and dark color palettes (#05070f, #18181c, #242427).
- **Dislikes**:
  - Svelte 4 stores.
  - Electron (due to its slow performance and size).
  - The use of npm or pnpm (always use Bun).
  - Premature abstractions.
  - Redundant comments explaining "what" the code does instead of "why" it does it.
  - Magic strings without constants when reused.
  - Massive commits with mixed responsibilities.
  - Emojis in code, documentation, or commit messages.

## Programming Style
- **Formatting and Style**:
  - Indentation with tabs and a width of 2 spaces.
  - Use of single quotes for strings.
  - Semicolons are mandatory at the end of statements.
  - Maximum line width of 160 characters.
  - Trailing newline required at the end of the file.
- **Naming Conventions**:
  - PascalCase for classes, components, types, interfaces, and component or class files.
  - camelCase for functions, methods, variables, and utility files.
  - SCREAMING_SNAKE_CASE for constants.
  - I prefix for interfaces (e.g., IFileSystem).
  - _Token suffix for DI symbols (e.g., IFileSystem_Token).
- **File Names**:
  - PascalCase.svelte for components, pages, and layouts.
  - PascalCase.ts for class modules or service files.
  - camelCase.ts for utilities, local stores, and constants.
  - kebab-case.* exclusively for configuration files.
- **Types vs Interfaces**:
  - interface for object shapes with methods / extendable APIs.
  - type for unions, intersections, and simple aliases.
  - Prioritize import type over common imports unless dependency injection requires the value at runtime.
- **Component Patterns (Svelte 5)**:
  - Ordered script block: 1. imports, 2. local type definitions, 3. $props(), 4. $state(), 5. $derived(), 6. $effect(), 7. functions and handlers.
  - Use onclick directive instead of on:click.
- **Error Handling**:
  - try/catch with silent fallback to prevent a single mod's failure from crashing the entire scan.
  - Log errors (Log_Error) and return default values (null/empty).
  - Early returns on null/undefined in secondary flows.
  - Controlled assertions for critical preconditions.

## Available Validation Scripts
- **bun run lint**: Runs Biome to analyze and format code, applying auto-fixes.
- **bun run check**: Runs svelte-check and tsc to check types across the frontend.
- **bun run test**: Runs project tests using the Bun test runner.


**Mandatory after any feat/change touching `.svelte` files**: run `bun test:e2e`. If it fails, fix, re-run, repeat until green — NO workarounds/patches, real FIXES. Same rule as `bun check`: never leave it red.
NEVER use npx, pnpm, yarn related command. FORBIDDEN
I use normally POWERSHELL commands, so powershell commands.
I have installed WSL in case you need very specific linux-only commands with ubuntu there.

- **State**: LocalStorage for persistence + Svelte 5 Store files.
- **Styling**: 
  - Tailwind CSS 4 TOTALLY — only use `<style>` blocks for complext animations, if its more readable in CSS, do it in CSS, otherwise tailwind. T
  - There will be a global.css files with the global app pallete colors. (currently not, i need to fix this)
  - If needed critical CSS for components or pages (putting css in global.css) Must have a prefix baseed on page/section that will be used (prefixed, e.g. `--PAGE-COMPONENT-bg`, `--PAGE-width`, etc..).Reference variables directly in Tailwind classes with the v4 paren syntax: `text-(--RFCS-primary)`, `bg-(--RFCS-surface-container-low)`. Use `twMerge` to compose dynamic classes.
- Prefer path aliases (`tsconfig.json`): `@assets/*` → `src/assets/*`, `@components/*` → `src/components/*`. If missing, create it and use it.

- **Svelte 5** (`.svelte`, `src/components/satnow/<section>/`) owns interactive "islands", hydrated with `client:load`/`client:visible`/`client:only="svelte"`. Use runes only (`$state`, `$derived`, `$props`) — no Svelte 4 `let`-reactivity or `$:`.

# Naming conventions (frontend TypeScript — mirrors backend C# philosophy)

The frontend deliberately borrows C# OOP conventions rather than idiomatic functional TS:

| Element | Convention | Example |
|---|---|---|
| Classes | `PascalCase` | `AuthStore` |
| Class private fields/methods | `#camelCase` | `#loginAttempts`, `#startBanTimer()` |
| Public class methods | `PascalCase` | `Login()`, `SignIn()` |
| Standalone functions | `camelCase` | `handleSubmit()` |
| Svelte stores/singletons | `PascalCase` exported const | `export const AuthStore` |
| Types/interfaces | `PascalCase`, domain-prefixed | `API_Workspace_GET_Response` |
| Local variables | `camelCase` | `errorMessage` |
| Constants | `UPPER_SNAKE_CASE` | `CODE_LENGTH` |

Directories: `snake_case` (`satnow`, `interactivity`). 
Non-component logic files: `camelCase` (`workspaceState.ts`), 
Class-based files which use `PascalCase` (`SatAPI.ts`).
SvelteComponentFiles use `PascalCase` (`MyComponent.svelte.ts`)

# Language convention
Code identifiers and in-code comments: ALWAYS English. 
User-facing UI strings (labels, errors, placeholders): ALWAYS english for  now, no i18n so far.


# Normal flow
IF (new feature):
  - Normally enter into PLAN MODE FIRST
  WHILE (userChangesThePlanAndImprovesIt)
    ...normal
  ENDWHILE
  IF (userApprovedPlan)
    /** ...**/
    /** after implementing the plan, you should create a history-spec file in ./SAT-WEBSITE/specs/ with format `${2DigitsNubmer}-${goodnameRelativetotheplan}.md`
    Then APPEND in ./SAT-WEBSITE/specs/history.md a new entry at the end, with this new file and the current date.
  ENDIF
  /** after 
ENDIF

## Mandatory: history-spec after ANY implemented plan
This is NOT optional and NOT limited to "big" features. ANY time a plan (Plan Mode or otherwise) gets implemented — code changes actually applied, not just discussed — before ending the turn:
1. Create `./src/specs/${2DigitsNumber}-${goodname}.md` describing what shipped (context, what changed, key files touched, how to verify).
2. Append one line to `./src/specs/history.md` referencing that file + current date.
Do this even for small/self-contained plans (e.g. adding a test suite, a tooling setup) — it was skipped once for the Playwright E2E setup and should not be skipped again. If a plan's own verification step is explicitly gated on the user confirming something manually (e.g. "after this works, write the spec"), wait for that confirmation — but don't forget once given.
