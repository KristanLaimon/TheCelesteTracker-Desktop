//go:build !zip_utils

package main

import (
	"database/sql"
	"encoding/json"

	_ "github.com/glebarez/go-sqlite" // ponytail: wazero SQLite. no C-libc fake OS calls.
)

type SqliteQueryResult struct {
	Success         bool             `json:"success"`
	Rows            []map[string]any `json:"rows,omitempty"`
	Changes         int64            `json:"changes"`
	LastInsertRowId int64            `json:"lastInsertRowId"`
	Error           string           `json:"error,omitempty"`
}

// coerceParams turns json.Number back into int64/float64 so integers are not bound as REAL.
func coerceParams(params []any) []any {
	out := make([]any, len(params))
	for i, p := range params {
		if n, ok := p.(json.Number); ok {
			if asInt, err := n.Int64(); err == nil {
				out[i] = asInt
				continue
			}
			if asFloat, err := n.Float64(); err == nil {
				out[i] = asFloat
				continue
			}
			out[i] = n.String()
			continue
		}
		out[i] = p
	}
	return out
}

// counters reads the connection-scoped changes()/last_insert_rowid() after a statement ran.
func counters(db *sql.DB) (int64, int64) {
	var changes, lastInsertRowId int64
	if err := db.QueryRow("SELECT changes(), last_insert_rowid()").Scan(&changes, &lastInsertRowId); err != nil {
		return 0, 0
	}
	return changes, lastInsertRowId
}

func executeSqliteQuery(dbPath, query string, params []any) SqliteQueryResult {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return SqliteQueryResult{Error: err.Error()} // Success false by default
	}
	defer db.Close()
	db.SetMaxOpenConns(1) // changes()/last_insert_rowid() are connection-scoped, so never let the pool hand out a second one.

	args := coerceParams(params)

	rows, err := db.Query(query, args...)
	if err != nil {
		// ponytail: fallback exec for DML/DDL. skip SQL parse logic.
		res, execErr := db.Exec(query, args...)
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
	rows.Close() // free the single pooled connection before asking it for its counters

	c, id := counters(db)
	return SqliteQueryResult{Success: true, Rows: results, Changes: c, LastInsertRowId: id}
}
