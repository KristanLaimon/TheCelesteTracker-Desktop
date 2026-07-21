# AGENTS.md — TheCelesteTrackerDesktop

## Personality & Values

- **You are terse, practical, and ship-first.** Don't overthink. Don't add abstractions "just in case." Solve the problem in front of you.
- **YAGNI is gospel.** Every abstraction, helper, and configurable option must earn its keep. If it's not needed right now, delete it.
- **Prefer the standard library** over a new dependency. Prefer one line over fifty.
- **Don't add comments.** The code should speak for itself. JSDoc on public APIs is fine; inline explanations of obvious code is not.
- **No emojis ever.** Not in code, not in docs, not in commit messages.

## Non-Negotiables

- **NEVER remove `biome-ignore` comments.** They are there for a reason. If you think one is stale, ask.
- **Svelte 5 runes only.** `$state`, `$derived`, `$props`, `$effect`, `$bindable`. No Svelte 4 stores (`writable`, `readable`, `derived`). No slots (use `{#snippet}` + `{@render}`).
- **Bun only.** No npm, no pnpm. `bun install`, `bun run <script>`, `bun test`.
- **Run `bun run lint` before and after making changes.** (Biome auto-fixes.)
- **Run `bun run check` for type checking** (`svelte-check` + `tsc`).

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

- **Indent:** tabs, width 2 (Biome rules, ignore `.editorconfig`)
- **Quotes:** single quotes
- **Semicolons:** required
- **Line width:** 160
- **Trailing newline:** yes
- **Naming:**
  - `PascalCase` — classes, components, types, interfaces, files for components/classes
  - `camelCase` — functions, methods, variables, utility files
  - `SCREAMING_SNAKE_CASE` — constants
  - `I` prefix — interfaces (`IFileSystem`, `IOS`)
  - `_Token` suffix — DI token symbols (`IFileSystem_Token`)
- **File names:**
  - `PascalCase.svelte` — components, pages, layouts
  - `PascalCase.ts` — class modules, service files
  - `camelCase.ts` — utilities, stores, constants
  - `kebab-case.*` — config files only
- **Types vs Interfaces:** `interface` for object shapes with methods / extendable APIs; `type` for unions, intersections, mapped types, and simple aliases.
- **Imports order:** externals first, then relative project imports, then type-only (`import type`). Imports auto-organized by Biome on save.
- **`import type` is preferred** — unless DI decorators require the value at runtime (then use `// biome-ignore-all lint/style/useImportType`).

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

- Props type declared inline or as a `type Props = {...}` before `$props()`.
- Use `$bindable()` for two-way binding props (e.g., canvas `x`, `y`, `zoom`).
- No `on:click` — Svelte 5 uses `onclick`.
- Use `{#key expr}` to force re-creation of components on route/state change.
- Svelte transitions: `fade`, `fly` from `svelte/transition`.
- A11y warnings suppressed individually with `<!-- svelte-ignore a11y_... -->` comments.

## Styling

- **Tailwind utility classes** in templates for most styling.
- **Scoped `<style>` blocks** for component-specific overrides.
- **`:global()`** only when necessary (third-party library theming).
- **Dark theme**: backgrounds `#05070f`, `#18181c`, `#242427`. Glassmorphism effects.
- **CSS variables** for theme tokens (`--font-*`, `--gl-*`).

## Architecture

- **No global state stores.** All state is local via `$state()`. The Router singleton (uses `$state`) is the only global reactive state.
- **DI container** (`src/libs/DI.ts`) for service location — not reactive, just constructor injection.
- **Custom client-side router** (`src/router.svelte.ts`) — no router library.
- **Abstracted platform** via `IFileSystem`, `IOS`, `IThread` — allows Neutralino production vs Node.js test implementations.
- **Go CLI helpers** for SQLite + ZIP (communicate via JSON on stdout). New native-feature helpers should follow this pattern.

## File Structure

```
src/
├── index.ts              — entry point (mounts loading → app)
├── index.svelte          — root component (router outlet + command center)
├── router.svelte.ts      — custom router
├── router_setup.ts       — route registration
├── components/           — reusable components
├── layouts/              — layout components (CenteredLayout)
├── pages/                — page components
├── libs/                 — services, utilities, DI
├── interfaces/           — interface definitions + DI tokens
├── assets/               — static images
├── CTDB/                 — database service + types
testing/                  — all test files (bun test)
src-utils/                — Go CLI helpers + TS wrappers
docs/                     — documentation (database schemas, feature specs)
```

## Testing

- **`bun test`** — test runner.
- Files in `/testing/*.test.ts`.
- Separate test DI setup in `testing/setup.ts` (NodeJsFileSystem, NodeJsOS, BunThread).
- `describe` / `test` / `expect` from `bun:test`.
- Use `{ timeout: N_MS }` for long-running integration tests.
- `GetDependency()` helper for DI-resolved service instances.

## Error Handling

- **Try/catch with silent fallback** — don't let one mod's failure crash the whole scan.
- **Log error + return default** — `Log_Error(...)` then return null/empty.
- **Early return** on null/undefined instead of throwing for non-critical paths.
- **Smoke-test throws** for critical precondition failures (`if (!x) throw new Error(...)`).
- **`Promise.allSettled`** for batched API calls where partial failure is acceptable.

## What I Like

- Clean, minimal, no-bloat code that solves the actual problem
- Svelte 5 runes — they eliminated the store layer entirely
- Custom implementations over yet-another-framework (custom router, custom canvas, custom DI wiring)
- Platform abstraction (IFileSystem/IOS swapping) — it keeps tests fast and production lean
- Go CLI for native operations — tiny, self-contained binaries, no Electron bloat
- Biome over the ESLint+Prettier circus — one tool, one config, fast
- TypeScript strict mode with `noUnused*` catching slop before runtime
- Golden Layout — because multi-pane window management is genuinely hard and it does it well
- Dark themes with glassmorphism — it looks good and uses almost no CSS
- JSON-over-stdout for child process communication — simple, debuggable, language-agnostic

## What I Don't Like

- Svelte 4 stores — the rune era made them obsolete
- Electron — Neutralino is lighter, faster, simpler
- npm/pnpm — Bun does everything faster
- Over-abstraction — don't wrap a function call in a class "just in case we swap it later"
- Unnecessary dependencies — every dep is a liability, not a flex
- Verbose boilerplate — you don't need a state management library for a checkbox
- Additive comments that explain what the code does instead of why
- Magic strings without constants when they're reused
- Huge PRs — one concern per commit
- Frameworks that fight you (looking at you, old-webpack)
