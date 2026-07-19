package main

import (
	"encoding/json"
	"fmt"
	"os"
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
