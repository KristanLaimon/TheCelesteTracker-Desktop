# Removal of Path Aliases in Favor of Relative Imports

Created 2026-07-25.

## Context & Decision

Path aliases (e.g. `@core/*`, `@domain/*`, `@api/*`, `@db/*`, `@utils/*`, `@libs/*`, `@pages/*`, `@components/*`, `@layouts/*`, `@assets/*`, `@go/*`) introduced complexity across build tooling (TypeScript `paths`, Vite `resolve.alias`, `vite-tsconfig-paths`, `svelte-check`, bundlers on Windows).

To eliminate cross-tool resolver friction and simplify import resolution across dev servers, tests, and bundlers, all `@` path aliases were removed in favor of standard relative imports.

## Changes Made

1. **tsconfig.json**: Removed `compilerOptions.paths`.
2. **vite.config.ts**: Removed `aliases` object, `resolve.alias`, `optimizeDeps.exclude`, and `tsconfigPaths()`.
3. **Source & Test Codebase**: Transformed all imports starting with `@alias/` to relative imports (`./...` or `../...`) across 63 `.ts`, `.js`, and `.svelte` files.

## Guidelines

- All internal imports must use explicit relative paths (e.g. `import { Logger } from "../utils/Logger";`).
- External npm packages using `@` scopes (such as `@sveltejs/vite-plugin-svelte` or `@tailwindcss/vite`) remain unaffected.
