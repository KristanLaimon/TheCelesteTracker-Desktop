# Vite Windows Path Alias Resolution

Created 2026-07-25.

## Context & Symptom

Running Vite dev server on Windows / `bun start` (`neu run`) reported:
`[vite] (client) Pre-transform error: Failed to resolve import "@utils/StringSimilarity" from "src/components/SearchDynamic.svelte". Does the file exist?`

`tsc` passed cleanly via `bun run check`, but Vite dev server failed to pre-transform/pre-bundle modules imported via `@utils/*`, `@api/*`, `@core/*`, `@domain/*`, etc.

## Causes

1. **Backslash Separators on Windows**: In `vite.config.ts`, `resolve.alias` mapped aliases using `fileURLToPath(new URL(dir, import.meta.url))`, which produces Windows backslashes (e.g. `C:\Users\...`). Vite's import analyzer matches imports via POSIX slashes (`/`), producing mixed separator paths.
2. **Vite 8 Dependency Scanning (`optimizeDeps`)**: In Vite 8, `optimizeDeps` scans application entry points via Rolldown. When encountering imports starting with `@...`, Rolldown attempts to check if they are external packages to pre-bundle. When unexcluded, Rolldown fails the dependency scan on internal path aliases without extensions, aborting dependency pre-bundling.

## Fixes

1. **Forward Slash Normalization**:
   `fileURLToPath(new URL(dir, import.meta.url)).replace(/\\/g, "/")`
2. **Exclude Path Aliases from `optimizeDeps`**:
   `optimizeDeps: { exclude: Object.keys(aliases) }`
3. **Add `vite-tsconfig-paths`**:
   Added `tsconfigPaths()` plugin to `vite.config.ts` so Vite natively resolves `compilerOptions.paths` from `tsconfig.json`.
