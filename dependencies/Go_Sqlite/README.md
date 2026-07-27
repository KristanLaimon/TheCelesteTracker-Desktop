# Sqlite

`Sqlite` is a pure-Go CLI query execution engine built on top of `github.com/glebarez/go-sqlite` (modernc.org/sqlite, CGO-free).

## Architecture

Built using Cobra CLI framework and structured modular architecture:

```
dependencies/Sqlite/
├── cmd/                        # Cobra CLI subcommand handlers
│   ├── root.go                 # Executable entrypoint & root command
│   └── query.go                # '--db' flag and stdin payload processor
├── pkg/
│   └── sqlite/                 # Core domain logic
│       ├── executor.go         # SQLite driver query execution & parameter coercion
│       ├── sqlite_test.go      # Go unit tests
│       └── types.go            # Payload and result data models
├── testing/                    # Test database fixtures
├── main.go                     # Go main package
└── go.mod
```

---

## Command & Usage

### Stdin Payload Execution
Target database path is passed via `--db`. SQL query and bound parameters (`?` placeholders) are passed via stdin as a JSON object.

```bash
echo '{"sql": "SELECT * FROM users WHERE id = ?;", "params": [1]}' | Sqlite --db "/path/to/database.db"
```

**Flags:**
- `--db` (Required): Path to SQLite database file.
- `--query`, `-q` (Optional): Alternative way to pass raw SQL string via flag instead of stdin.

**JSON Stdin Input Structure:**
```json
{
  "sql": "SELECT id, name FROM users WHERE role = ? AND active = ?;",
  "params": ["admin", 1]
}
```

**JSON Output:**
```json
{
  "success": true,
  "rows": [
    {
      "id": 1,
      "name": "Madeline",
      "role": "admin",
      "active": 1
    }
  ],
  "changes": 0,
  "lastInsertRowId": 0
}
```

For DML queries (`INSERT`, `UPDATE`, `DELETE`), `changes` returns the number of affected rows and `lastInsertRowId` returns the last generated row ID.

---

## Running Tests

Run native Go tests with:
```bash
go test ./...
```
