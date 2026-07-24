# .svelte.ts cross-file imports: drop the .ts suffix

When importing a `*.svelte.ts` singleton/store module from another file, write
the import path *without* the trailing `.ts` (e.g. `import x from
"./ModsSearch.store.svelte"`, not `"./ModsSearch.store.svelte.ts"`).

Writing the full `.svelte.ts` extension compiles fine under `bun test` but
fails `bun run check` (svelte-check) with:

```
An import path can only end with a '.ts' extension when
'allowImportingTsExtensions' is enabled.
```

Confirmed against the existing precedent (`router.svelte.ts` is imported as
`"./router.svelte"` everywhere in `src/`). Applies to every new
`*.svelte.ts` store file going forward (`ModsSearch.store.svelte.ts`,
`ModsSearch.rowsCache.store.svelte.ts`, `ModView.steering.svelte.ts`, etc).
