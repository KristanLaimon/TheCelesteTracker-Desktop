MANDATORY READ @CLAUDE.md

## User Defined Rules
- Always execute `bun run check` synchronously (never in background) after making changes to `.ts` or `.svelte` files, inspect the output, and fix any type/compilation errors immediately.
- **API Design (Options Object Pattern)**: Never use raw positional boolean flags as parameters in function/method signatures (e.g. `get(forceRefresh?: boolean)`). Always use a named options object parameter (e.g. `get(opts?: { forceRefresh?: boolean })`) for self-documenting, extensible code.

## Post-Flow Verification Commands
After implementing changes, run the following verification flow sequentially:
```bash
1. bun test                   # run all tests (Bun test runner, files in testing/*.test.ts)
2. bun run check              # svelte-check + tsc type checking
3. bun run lint:fix           # biome check . --write --unsafe auto-fixes
4. bun run check              # verify lint:fix didn't break types
```

## Git Commit Workflow
- When implementing a multi-part plan (several distinct features/files), commit one logical part per feature — not one giant commit. Each commit should pass `bun run check` + relevant tests on its own.
- Commit body format: bullet list, one line per change, not prose paragraphs.
  ```
  feat(scope): short summary line

  - change 1: short description
  - change 2: short description

  Co-Authored-By: Gemini 3.6 Flash <noreply@google.com>
  ```

## Second-Brain Workflow
- **Business rules**: Celeste domain facts, save file shapes, mod structure, architecture. Fold into `CLAUDE.md` / `GEMINI.md`.
- **Process & tooling learnings**: Process learnings, environment gotchas, dead ends. Add as numbered files under `.claude/brain/NN-name.md` (see `.claude/brain/01-second-brain-convention.md`).
- After completing non-trivial tasks:
  1. Record durable business rules in `CLAUDE.md` / `GEMINI.md`.
  2. Record process/meta learnings as a new numbered thought file in `.claude/brain/`.