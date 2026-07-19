package main

import (
	"database/sql"

	_ "github.com/glebarez/go-sqlite" // ponytail: wazero SQLite. no C-libc fake OS calls.
)

type SqliteQueryResult struct {
	Success         bool             `json:"success"`
	Rows            []map[string]any `json:"rows,omitempty"`
	Changes         int64            `json:"changes,omitempty"`
	LastInsertRowId int64            `json:"lastInsertRowId,omitempty"`
	Error           string           `json:"error,omitempty"`
}

func executeSqliteQuery(dbPath, query string) SqliteQueryResult {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return SqliteQueryResult{Error: err.Error()} // Success false by default
	}
	defer db.Close()

	rows, err := db.Query(query)
	if err != nil {
		// ponytail: fallback exec for DML/DDL. skip SQL parse logic.
		res, execErr := db.Exec(query)
		if execErr != nil {
			return SqliteQueryResult{Error: execErr.Error()}
		}
		c, _ := res.RowsAffected()
		id, _ := res.LastInsertId()
		return SqliteQueryResult{Success: true, Rows: []map[string]any{}, Changes: c, LastInsertRowId: id}
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return SqliteQueryResult{Error: err.Error()}
	}

	results := []map[string]any{}
	vals := make([]any, len(cols))
	ptrs := make([]any, len(cols))
	for i := range vals {
		ptrs[i] = &vals[i]
	}

	for rows.Next() {
		if err := rows.Scan(ptrs...); err != nil {
			return SqliteQueryResult{Error: err.Error()}
		}
		row := make(map[string]any, len(cols))
		for i, col := range cols {
			val := vals[i]
			if b, ok := val.([]byte); ok {
				val = string(b)
			}
			row[col] = val
		}
		results = append(results, row)
	}

	if err := rows.Err(); err != nil {
		return SqliteQueryResult{Error: err.Error()}
	}

	return SqliteQueryResult{Success: true, Rows: results}
}
