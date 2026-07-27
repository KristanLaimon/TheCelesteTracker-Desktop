MANDATORY READ @CLAUDE.md

## User Defined Rules
- Always execute `bun run check` synchronously (never in background) after making changes to `.ts` or `.svelte` files, inspect the output, and fix any type/compilation errors immediately.
- **API Design (Options Object Pattern)**: Never use raw positional boolean flags as parameters in function/method signatures (e.g. `get(forceRefresh?: boolean)`). Always use a named options object parameter (e.g. `get(opts?: { forceRefresh?: boolean })`) for self-documenting, extensible code.
- **Global Svelte 5 Store Pattern (`*.store.svelte.ts`)**: Encapsulated unexported store class in `*.store.svelte.ts` that self-initializes in constructor (`GetDependency(...)`), uses `$state` fields & `PascalCase` mutation methods, and exports default instance (`const store = new Store(); export default store;`). Outside UI components MUST NOT initialize global stores; they only consume getters/setters.


## Post-Flow Verification Commands
After implementing changes, run the following verification flow sequentially:
```bash
1. bun test                   # run all tests (Bun test runner, files in testing/*.test.ts)
2. bun run check              # svelte-check + tsc type checking
3. bun run lint:fix           # biome check . --write --unsafe auto-fixes
4. bun run check              # verify lint:fix didn't break types
```

## Second-Brain Workflow
- **Business rules**: Celeste domain facts, save file shapes, mod structure, architecture. Fold into `CLAUDE.md` / `GEMINI.md`.
- **Process & tooling learnings**: Process learnings, environment gotchas, dead ends. Add as numbered files under `.claude/brain/NN-name.md` (see `.claude/brain/01-second-brain-convention.md`).
- After completing non-trivial tasks:
  1. Record durable business rules in `CLAUDE.md` / `GEMINI.md`.
  2. Record process/meta learnings as a new numbered thought file in `.claude/brain/`.