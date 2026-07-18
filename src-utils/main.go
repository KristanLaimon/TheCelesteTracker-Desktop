package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

// Global response types to match the expected format
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

func main() {
	var rootCmd = &cobra.Command{
		Use:   "utilities",
		Short: "Celeste Tracker Desktop Go utilities CLI helper",
	}

	// SQLite Command
	var dbPath string
	var query string
	var sqliteCmd = &cobra.Command{
		Use:   "sqlite",
		Short: "Execute a SQLite query and print the result as JSON",
		Run: func(cmd *cobra.Command, args []string) {
			if dbPath == "" {
				fmt.Println(`{"success":false,"error":"--db is required"}`)
				os.Exit(1)
			}

			sqlQuery := query
			if sqlQuery == "" {
				// Read from stdin
				bytes, err := io.ReadAll(os.Stdin)
				if err != nil {
					fmt.Printf(`{"success":false,"error":"failed to read query from stdin: %s"}`+"\n", err.Error())
					os.Exit(1)
				}
				sqlQuery = strings.TrimSpace(string(bytes))
			}

			if sqlQuery == "" {
				fmt.Println(`{"success":false,"error":"query is empty"}`)
				os.Exit(1)
			}

			result := executeSqliteQuery(dbPath, sqlQuery)
			output, err := json.Marshal(result)
			if err != nil {
				fmt.Printf(`{"success":false,"error":"failed to marshal json: %s"}`+"\n", err.Error())
				os.Exit(1)
			}
			fmt.Println(string(output))
			if !result.Success {
				os.Exit(1)
			}
		},
	}
	sqliteCmd.Flags().StringVarP(&dbPath, "db", "d", "", "Path to SQLite database file")
	sqliteCmd.Flags().StringVarP(&query, "query", "q", "", "SQL query to execute (reads from stdin if empty)")
	rootCmd.AddCommand(sqliteCmd)

	// Zip Command Group
	var zipCmd = &cobra.Command{
		Use:   "zip",
		Short: "Zip archive utilities",
	}

	// Zip Read Subcommand
	var zipFile string
	var innerFile string
	var zipReadCmd = &cobra.Command{
		Use:   "read",
		Short: "Read a text file inside a zip archive",
		Run: func(cmd *cobra.Command, args []string) {
			content, err := zipReadTextFile(zipFile, innerFile)
			if err != nil {
				res := ZipReadResult{Success: false, Error: err.Error()}
				out, _ := json.Marshal(res)
				fmt.Println(string(out))
				os.Exit(1)
			}
			res := ZipReadResult{Success: true, Content: content}
			out, _ := json.Marshal(res)
			fmt.Println(string(out))
		},
	}
	zipReadCmd.Flags().StringVarP(&zipFile, "zip", "z", "", "Path to the zip file")
	zipReadCmd.Flags().StringVarP(&innerFile, "file", "f", "", "File path inside the zip archive")
	zipReadCmd.MarkFlagRequired("zip")
	zipReadCmd.MarkFlagRequired("file")
	zipCmd.AddCommand(zipReadCmd)

	// Zip List Subcommand
	var zipListCmd = &cobra.Command{
		Use:   "list",
		Short: "List files inside a zip archive",
		Run: func(cmd *cobra.Command, args []string) {
			files, err := zipList(zipFile)
			if err != nil {
				res := ZipListResult{Success: false, Error: err.Error()}
				out, _ := json.Marshal(res)
				fmt.Println(string(out))
				os.Exit(1)
			}
			res := ZipListResult{Success: true, Files: files}
			out, _ := json.Marshal(res)
			fmt.Println(string(out))
		},
	}
	zipListCmd.Flags().StringVarP(&zipFile, "zip", "z", "", "Path to the zip file")
	zipListCmd.MarkFlagRequired("zip")
	zipCmd.AddCommand(zipListCmd)

	// Zip Unzip Subcommand
	var destPath string
	var zipUnzipCmd = &cobra.Command{
		Use:   "unzip",
		Short: "Extract a zip archive into a destination directory",
		Run: func(cmd *cobra.Command, args []string) {
			err := unzip(zipFile, destPath)
			if err != nil {
				res := ZipGenericResult{Success: false, Error: err.Error()}
				out, _ := json.Marshal(res)
				fmt.Println(string(out))
				os.Exit(1)
			}
			res := ZipGenericResult{Success: true}
			out, _ := json.Marshal(res)
			fmt.Println(string(out))
		},
	}
	zipUnzipCmd.Flags().StringVarP(&zipFile, "zip", "z", "", "Path to the zip file")
	zipUnzipCmd.Flags().StringVarP(&destPath, "dest", "e", "", "Destination directory")
	zipUnzipCmd.MarkFlagRequired("zip")
	zipUnzipCmd.MarkFlagRequired("dest")
	zipCmd.AddCommand(zipUnzipCmd)

	// Zip Pack Subcommand
	var srcPath string
	var zipPackCmd = &cobra.Command{
		Use:   "pack",
		Short: "Compress a folder into a zip archive",
		Run: func(cmd *cobra.Command, args []string) {
			err := zipFolder(srcPath, zipFile)
			if err != nil {
				res := ZipGenericResult{Success: false, Error: err.Error()}
				out, _ := json.Marshal(res)
				fmt.Println(string(out))
				os.Exit(1)
			}
			res := ZipGenericResult{Success: true}
			out, _ := json.Marshal(res)
			fmt.Println(string(out))
		},
	}
	zipPackCmd.Flags().StringVarP(&srcPath, "src", "s", "", "Source folder to compress")
	zipPackCmd.Flags().StringVarP(&zipFile, "zip", "z", "", "Output zip file path")
	zipPackCmd.MarkFlagRequired("src")
	zipPackCmd.MarkFlagRequired("zip")
	zipCmd.AddCommand(zipPackCmd)

	rootCmd.AddCommand(zipCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Printf(`{"success":false,"error":"%s"}`+"\n", err.Error())
		os.Exit(1)
	}
}
