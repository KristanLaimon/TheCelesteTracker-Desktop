# Svelte 5 Runes in Bun Test Runner

## Context
Svelte 5 runes (`$state`, `$derived`, etc.) are compiler primitives transformed by Vite / Svelte plugin.
When unit testing `.svelte.ts` store files directly with `bun test`, Bun executes raw JS/TS without Vite compiler transformations, causing `$state` to throw a `ReferenceError: $state is not defined`.

## Learnings
1. Setting a fallback polyfill in `testing/setup.ts`:
   ```ts
   if (typeof (globalThis as Record<string, unknown>).$state === "undefined") {
   	(globalThis as Record<string, unknown>).$state = <T>(initialValue: T): T => initialValue;
   }
   ```
   allows Svelte 5 `.svelte.ts` store files to be directly imported and tested inside Bun test suite (`bun test`) without compiler errors.
