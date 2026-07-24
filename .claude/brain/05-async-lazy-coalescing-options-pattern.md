# 05 - AsyncLazy Request Coalescing & Options Object Pattern

## Learnings & Patterns

1. **AsyncLazy Pattern (Coalescing + Persistent Promise Caching)**:
   - When multiple concurrent callers invoke a heavy initial async operation, `AsyncLazy` executes the factory once and returns the exact same `Promise` handle to all in-flight callers (coalescing 50 concurrent requests into 1 execution).
   - Once resolved, the `Promise` remains cached for instant subsequent reads.

2. **Argument & Context Forwarding**:
   - `AsyncLazy<T, TArgs>` forwards `args` (e.g. `opts?: LocalModsOptions`) directly to `factory(args)`.
   - This ensures internal/nested methods (such as `#ComputeHistoricalMods(opts)` -> `EverestMods_GetAll(opts)`) receive the full options context without losing flags.

3. **Options Object Pattern**:
   - Always avoid raw positional boolean arguments in API method signatures (e.g. `get(forceRefresh?: boolean)`).
   - Use named options objects (e.g. `get(opts?: { forceRefresh?: boolean })`) for self-documenting and extensible code.
