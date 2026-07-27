package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"sqlite/pkg/sqlite"

	"github.com/spf13/cobra"
)

func send(v any) {
	out, _ := json.Marshal(v)
	fmt.Println(string(out))
}

func failStr(msg string) {
	send(sqlite.SqliteQueryResult{Success: false, Error: msg})
	os.Exit(1)
}

func NewRootCmd() *cobra.Command {
	root := &cobra.Command{
		Use:   "Sqlite",
		Short: "Celeste Tracker SQLite Helper",
		Run:   runQuery,
	}

	sqliteSub := &cobra.Command{
		Use:   "sqlite",
		Short: "Execute SQLite query",
		Run:   runQuery,
	}

	initQueryCmd(root)
	initQueryCmd(sqliteSub)
	root.AddCommand(sqliteSub)

	return root
}

func Execute() {
	cmd := NewRootCmd()
	if err := cmd.Execute(); err != nil {
		failStr(err.Error())
	}
}
