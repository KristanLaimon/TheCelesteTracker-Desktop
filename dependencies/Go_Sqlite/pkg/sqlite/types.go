package sqlite

type SqliteStdinPayload struct {
	Sql    string `json:"sql"`
	Params []any  `json:"params"`
}

type SqliteQueryResult struct {
	Success         bool             `json:"success"`
	Rows            []map[string]any `json:"rows,omitempty"`
	Changes         int64            `json:"changes"`
	LastInsertRowId int64            `json:"lastInsertRowId"`
	Error           string           `json:"error,omitempty"`
}
