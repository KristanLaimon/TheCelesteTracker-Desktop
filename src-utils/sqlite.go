package main

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

type SqliteQueryResult struct {
	Success         bool                     `json:"success"`
	Rows            []map[string]interface{} `json:"rows,omitempty"`
	Changes         int64                    `json:"changes,omitempty"`
	LastInsertRowId int64                    `json:"lastInsertRowId,omitempty"`
	Error           string                   `json:"error,omitempty"`
}

// ─────────────────────────────────────────────────────────────────────────────
// SQLite execution
// ─────────────────────────────────────────────────────────────────────────────

func executeSqliteQuery(dbPath, sqlQuery string) SqliteQueryResult {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return SqliteQueryResult{Success: false, Error: err.Error()}
	}
	defer db.Close()

	rows, err := db.Query(sqlQuery)
	if err != nil {
		// Not a SELECT — try as an exec statement
		result, execErr := db.Exec(sqlQuery)
		if execErr != nil {
			return SqliteQueryResult{Success: false, Error: execErr.Error()}
		}
		changes, _ := result.RowsAffected()
		lastId, _ := result.LastInsertId()
		return SqliteQueryResult{
			Success:         true,
			Rows:            []map[string]interface{}{},
			Changes:         changes,
			LastInsertRowId: lastId,
		}
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return SqliteQueryResult{Success: false, Error: err.Error()}
	}

	var results []map[string]interface{}
	for rows.Next() {
		values := make([]interface{}, len(cols))
		valuePtrs := make([]interface{}, len(cols))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return SqliteQueryResult{Success: false, Error: err.Error()}
		}

		row := make(map[string]interface{}, len(cols))
		for i, col := range cols {
			val := values[i]
			// Convert []byte to string for TEXT columns
			if b, ok := val.([]byte); ok {
				val = string(b)
			}
			row[col] = val
		}
		results = append(results, row)
	}

	if err := rows.Err(); err != nil {
		return SqliteQueryResult{Success: false, Error: err.Error()}
	}

	if results == nil {
		results = []map[string]interface{}{}
	}
	return SqliteQueryResult{Success: true, Rows: results}
}
