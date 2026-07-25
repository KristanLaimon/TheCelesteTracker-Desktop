# Vite Windows Path Alias Resolution

Created 2026-07-25.

## Context & Symptom

Running Vite dev server on Windows reported:
`[vite] (client) Pre-transform error: Failed to resolve import "@utils/Hotkeys" from "src/index.svelte". Does the file exist?`

`tsc` passed cleanly via `bun run check`, but Vite dev server failed to pre-transform/pre-bundle modules imported via `@utils/*`, `@api/*`, `@core/*`, etc.

## Cause

In `vite.config.ts`, `resolve.alias` mapped aliases using:
`fileURLToPath(new URL(dir, import.meta.url))`

On Windows, `fileURLToPath` produces Windows backslashes (e.g. `C:\Users\...`).
Vite's dev server import analyzer matches imports via POSIX slashes (`/`). Substituting `@utils` with backslash paths caused Vite dev server to construct mixed separator paths (e.g. `C:\Users\...\src\utils/Hotkeys`) that failed module graph resolution.

## Fix

Normalize the backslashes to forward slashes when constructing Vite alias entries:
`fileURLToPath(new URL(dir, import.meta.url)).replace(/\\/g, "/")`
