//go:build zip_utils

package main

import (
	"github.com/spf13/cobra"
)

func main() {
	rootCmd := &cobra.Command{Use: "zip_utils", Short: "Celeste Tracker Zip CLI"}

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
