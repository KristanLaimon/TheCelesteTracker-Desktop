package cmd

import (
	"bytes"
	"io"
	"os"
	"strings"
	"testing"
)

const testDbPath = "../testing/Celeste/Saves/TheCelesteTracker_DB.db"

func captureStdout(f func()) string {
	r, w, err := os.Pipe()
	if err != nil {
		f()
		return ""
	}
	old := os.Stdout
	os.Stdout = w

	outC := make(chan string)
	go func() {
		var buf bytes.Buffer
		_, _ = io.Copy(&buf, r)
		outC <- buf.String()
	}()

	f()

	w.Close()
	os.Stdout = old
	out := <-outC
	_ = r.Close()
	return out
}

func TestSqliteQueryCmdWithDatabase(t *testing.T) {
	if _, err := os.Stat(testDbPath); os.IsNotExist(err) {
		t.Skipf("test db %s not found, skipping", testDbPath)
	}

	out := captureStdout(func() {
		cmd := NewRootCmd()
		cmd.SetArgs([]string{"--db", testDbPath, "--query", "SELECT name FROM sqlite_master WHERE type='table';"})
		_ = cmd.Execute()
	})

	if !strings.Contains(out, `"success":true`) {
		t.Errorf("Expected sqlite query output to contain success:true, got: %s", out)
	}
}
