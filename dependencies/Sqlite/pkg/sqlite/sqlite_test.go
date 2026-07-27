package sqlite

import (
	"os"
	"path/filepath"
	"testing"
)

func TestExecuteQuery(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "sqlite_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "test.db")

	// 1. Create table
	res1 := ExecuteQuery(dbPath, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);", nil)
	if !res1.Success {
		t.Fatalf("CREATE TABLE failed: %s", res1.Error)
	}

	// 2. Insert row
	res2 := ExecuteQuery(dbPath, "INSERT INTO users (name) VALUES (?);", []any{"Madeline"})
	if !res2.Success {
		t.Fatalf("INSERT failed: %s", res2.Error)
	}
	if res2.Changes != 1 {
		t.Errorf("Expected 1 row change, got %d", res2.Changes)
	}

	// 3. Query row
	res3 := ExecuteQuery(dbPath, "SELECT id, name FROM users WHERE name = ?;", []any{"Madeline"})
	if !res3.Success {
		t.Fatalf("SELECT failed: %s", res3.Error)
	}
	if len(res3.Rows) != 1 {
		t.Fatalf("Expected 1 row, got %d", len(res3.Rows))
	}
	if res3.Rows[0]["name"] != "Madeline" {
		t.Errorf("Expected user name Madeline, got %v", res3.Rows[0]["name"])
	}
}
