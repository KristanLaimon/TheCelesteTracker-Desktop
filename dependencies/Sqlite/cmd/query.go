package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"

	"sqlite/pkg/sqlite"
	"strings"

	"github.com/spf13/cobra"
)

func runQuery(cmd *cobra.Command, args []string) {
	dbPath, _ := cmd.Flags().GetString("db")
	queryStr, _ := cmd.Flags().GetString("query")

	if dbPath == "" {
		failStr("--db is required")
	}
	var params []any
	if queryStr == "" {
		b, err := io.ReadAll(os.Stdin)
		if err != nil {
			failStr(fmt.Sprintf("failed to read query: %v", err))
		}
		queryStr = strings.TrimSpace(strings.TrimPrefix(string(b), "\ufeff"))
		if strings.HasPrefix(queryStr, "{") {
			var payload sqlite.SqliteStdinPayload
			dec := json.NewDecoder(bytes.NewReader([]byte(queryStr)))
			dec.UseNumber()
			if err := dec.Decode(&payload); err != nil {
				failStr(fmt.Sprintf("failed to parse query payload: %v", err))
			}
			queryStr = strings.TrimSpace(payload.Sql)
			params = payload.Params
		}
	}
	if queryStr == "" {
		failStr("query is empty")
	}

	res := sqlite.ExecuteQuery(dbPath, queryStr, params)
	send(res)
	if !res.Success {
		os.Exit(1)
	}
}

func initQueryCmd(target *cobra.Command) {
	target.Flags().StringP("db", "d", "", "DB path")
	target.Flags().StringP("query", "q", "", "SQL query")
}
