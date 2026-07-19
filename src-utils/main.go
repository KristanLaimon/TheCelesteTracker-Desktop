package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

type ZipReadResult struct {
	Success bool   `json:"success"`
	Content string `json:"content,omitempty"`
	Error   string `json:"error,omitempty"`
}

type ZipListResult struct {
	Success bool     `json:"success"`
	Files   []string `json:"files,omitempty"`
	Error   string   `json:"error,omitempty"`
}

type ZipGenericResult struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// ponytail: generic print helpers keep strict types but drop boilerplate
func send(v any) {
	out, _ := json.Marshal(v)
	fmt.Println(string(out))
}

func fail(err error) {
	send(ZipGenericResult{Success: false, Error: err.Error()})
	os.Exit(1)
}

func failStr(msg string) {
	send(ZipGenericResult{Success: false, Error: msg})
	os.Exit(1)
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
			if query == "" {
				b, err := io.ReadAll(os.Stdin)
				if err != nil {
					failStr(fmt.Sprintf("failed to read query: %v", err))
				}
				query = strings.TrimSpace(string(b))
			}
			if query == "" {
				failStr("query is empty")
			}

			res := executeSqliteQuery(dbPath, query)
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

	zipCmd.AddCommand(readCmd, listCmd, unzipCmd, packCmd)
	rootCmd.AddCommand(zipCmd)

	if err := rootCmd.Execute(); err != nil {
		fail(err)
	}
}
