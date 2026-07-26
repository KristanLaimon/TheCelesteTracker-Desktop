//go:build !zip_utils

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

type sqliteStdinPayload struct {
	Sql    string `json:"sql"`
	Params []any  `json:"params"`
}

func main() {
	rootCmd := &cobra.Command{Use: "utilities", Short: "Celeste Tracker CLI"}

	var dbPath, query string
	sqliteCmd := &cobra.Command{
		Use: "sqlite",
		Run: func(cmd *cobra.Command, args []string) {
			if dbPath == "" {
				failStr("--db is required")
			}
			var params []any
			if query == "" {
				b, err := io.ReadAll(os.Stdin)
				if err != nil {
					failStr(fmt.Sprintf("failed to read query: %v", err))
				}
				query = strings.TrimSpace(strings.TrimPrefix(string(b), "\ufeff")) // some shells prepend a UTF-8 BOM when piping
				// JSON envelope {"sql":...,"params":[...]} when parameters are bound, raw SQL otherwise.
				if strings.HasPrefix(query, "{") {
					var payload sqliteStdinPayload
					dec := json.NewDecoder(bytes.NewReader([]byte(query)))
					dec.UseNumber()
					if err := dec.Decode(&payload); err != nil {
						failStr(fmt.Sprintf("failed to parse query payload: %v", err))
					}
					query = strings.TrimSpace(payload.Sql)
					params = payload.Params
				}
			}
			if query == "" {
				failStr("query is empty")
			}

			res := executeSqliteQuery(dbPath, query, params)
			send(res)
			// ponytail: assume res has Success bool field based on original logic
			if !res.Success {
				os.Exit(1)
			}
		},
	}
	sqliteCmd.Flags().StringVarP(&dbPath, "db", "d", "", "DB path")
	sqliteCmd.Flags().StringVarP(&query, "query", "q", "", "SQL query")
	rootCmd.AddCommand(sqliteCmd)

	var zipFile, inner, dest, src string
	zipCmd := &cobra.Command{Use: "zip"}

	readCmd := &cobra.Command{
		Use: "read",
		Run: func(cmd *cobra.Command, args []string) {
			c, err := zipReadTextFile(zipFile, inner)
			if err != nil {
				fail(err)
			}
			send(ZipReadResult{Success: true, Content: c})
		},
	}
	readCmd.Flags().StringVarP(&zipFile, "zip", "z", "", "Zip path")
	readCmd.Flags().StringVarP(&inner, "file", "f", "", "Inner path")
	readCmd.MarkFlagRequired("zip")
	readCmd.MarkFlagRequired("file")

	listCmd := &cobra.Command{
		Use: "list",
		Run: func(cmd *cobra.Command, args []string) {
			f, err := zipList(zipFile)
			if err != nil {
				fail(err)
			}
			send(ZipListResult{Success: true, Files: f})
		},
	}
	listCmd.Flags().StringVarP(&zipFile, "zip", "z", "", "Zip path")
	listCmd.MarkFlagRequired("zip")

	unzipCmd := &cobra.Command{
		Use: "unzip",
		Run: func(cmd *cobra.Command, args []string) {
			if err := unzip(zipFile, dest); err != nil {
				fail(err)
			}
			send(ZipGenericResult{Success: true})
		},
	}
	unzipCmd.Flags().StringVarP(&zipFile, "zip", "z", "", "Zip path")
	unzipCmd.Flags().StringVarP(&dest, "dest", "e", "", "Dest dir")
	unzipCmd.MarkFlagRequired("zip")
	unzipCmd.MarkFlagRequired("dest")

	packCmd := &cobra.Command{
		Use: "pack",
		Run: func(cmd *cobra.Command, args []string) {
			if err := zipFolder(src, zipFile); err != nil {
				fail(err)
			}
			send(ZipGenericResult{Success: true})
		},
	}
	packCmd.Flags().StringVarP(&src, "src", "s", "", "Src dir")
	packCmd.Flags().StringVarP(&zipFile, "zip", "z", "", "Zip path")
	packCmd.MarkFlagRequired("src")
	packCmd.MarkFlagRequired("zip")

	var modsDir string
	var numThreads int
	scanModsCmd := &cobra.Command{
		Use: "scan-mods",
		Run: func(cmd *cobra.Command, args []string) {
			res, err := zipScanMods(modsDir, numThreads)
			if err != nil {
				fail(err)
			}
			send(res)
		},
	}
	scanModsCmd.Flags().StringVarP(&modsDir, "dir", "d", "", "Mods directory path")
	scanModsCmd.Flags().IntVarP(&numThreads, "threads", "t", 0, "Number of parallel threads (0 = auto)")
	scanModsCmd.MarkFlagRequired("dir")

	zipCmd.AddCommand(readCmd, listCmd, unzipCmd, packCmd, scanModsCmd)
	rootCmd.AddCommand(zipCmd)

	if err := rootCmd.Execute(); err != nil {
		fail(err)
	}
}
