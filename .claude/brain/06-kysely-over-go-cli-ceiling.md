# Kysely over the Go CLI: what the transport can and cannot do

Written 2026-07-25, when `src/db/` moved from raw SQL strings to Kysely.

## The ceiling: one query = one process = one connection

`Sqlite_Go` spawns `bin/utilities-*` per statement. Nothing connection-scoped
survives between calls:

- **Transactions**: impossible. `SqliteGoDriver.beginTransaction()` throws on
  purpose instead of silently running statements outside a transaction. Kysely's
  `db.transaction()` is an interactive callback, so the statements cannot be
  buffered and shipped as one process either. Upgrade path if it ever matters:
  a Go subcommand taking an array of `{sql, params}` and wrapping them in
  `BEGIN`/`COMMIT`, exposed as an explicit batch API, not as Kysely's
  transaction interface.
- **`CREATE TEMP TABLE`, `PRAGMA`, session state**: gone with the process.
  A write test needs a real file copy of the DB, not a temp table.
- **`changes()` / `last_insert_rowid()`**: connection-scoped, so `sqlite.go`
  sets `db.SetMaxOpenConns(1)` and reads them right after the statement on the
  same handle. Without the cap, `database/sql` can hand the counter query a
  different connection and return 0.

Cost per query is a process spawn (a few ms). Fine for this app's read
patterns; loops issuing hundreds of statements should build one statement
instead.

## Gotchas hit along the way

- `bun add kysely` was the whole install. The dialect only implements
  `Driver`/`DatabaseConnection` — `SqliteAdapter`, `SqliteQueryCompiler` and
  `SqliteIntrospector` come from Kysely itself.
- **PowerShell prepends a UTF-8 BOM** when piping a string into a native exe.
  The Go side trims `U+FEFF` before deciding whether stdin is a JSON envelope
  or raw SQL. Without that, every piped payload looked like raw SQL and failed
  with `unrecognized token: "{"`.
- **`json.Decoder.UseNumber()` is load-bearing.** Plain `json.Unmarshal` into
  `[]any` turns every number into `float64`, which binds INTEGER columns as
  REAL and stores `1.0`.
- `src-utils/build.ts` was broken before this work: it passed the binary-name
  slugs (`win`, `mac`, `x64`) straight to `GOOS`/`GOARCH` (Go wants
  `windows`, `darwin`, `amd64`), and Bun's `$` interpolated `-tags zip_utils`
  as one argv entry. Both fixed; the slug -> Go value maps live at the top of
  the file.
- Kysely generic helper types leak: annotating a generic
  `Table(): SelectQueryBuilder<Database, K, {}>` fails because the real return
  uses `ExtractTableAlias<Database, K>`, which Kysely does not export. One
  cast in `submodules/_base.ts` beats twelve hand-written `Table()` overrides.
- `testing/test_with_data.db` is mutated by `Sqlite_Go_RawUsage.test.ts`
  (it INSERTs into `Users`). Expect it dirty in `git status` after `bun test`;
  `git checkout --` it before committing.
