package src

import (
	"fmt"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

var ___db *sqlx.DB;
var alreadyConnected bool = false

func Db_GetConnection() *sqlx.DB {
	if alreadyConnected {
		return ___db
	}

	celesteModDbPath, err := GetCelesteModTrackerDatabasePath()
	if err != nil {
		LogFatalError(err.Error())
	}

	// Use _fk=1 to enable foreign key support in sqlite3 driver
	dsn := fmt.Sprintf("%s?_fk=1", celesteModDbPath)
	_db, err := sqlx.Open("sqlite3", dsn)
	if err != nil {
		LogFatalError(err.Error())
	}

	___db = _db
	alreadyConnected = true
	return ___db
}

type Db_ExecResult struct {
  LastIdInserted int64
  RowsAffected int64
}
func Db_Exec(queryNoSelect string, args ...any) (Db_ExecResult, error) {
  _db := Db_GetConnection()
  
  var err error

  res, err := _db.Exec(queryNoSelect, args)
  if err != nil {
    return Db_ExecResult{}, err
  }


  lastId, err := res.LastInsertId()
  if err != nil {
    return Db_ExecResult{}, err
  }

  rowsAffected, err := res.RowsAffected()
  if err != nil {
    return Db_ExecResult{}, err
  }

  return Db_ExecResult{
    LastIdInserted: lastId ,
    RowsAffected: rowsAffected,
  }, nil
}

func Db_Select(typeToConvert any, query string, args ...any) error {
	_db := Db_GetConnection()

	err := _db.Select(typeToConvert, query, args...);

	if err != nil {
		LogError(fmt.Sprintf("[SQLITE Query] Error: %s", err))
		return err
	}

	return nil
}

func db_addColumn(db *sqlx.DB, table, col, def string) error {
	rows, err := db.Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		return err
	}
	defer rows.Close()

	exists := false
	for rows.Next() {
		var cid int
		var name, dtype string
		var notnull int
		var dflt_value interface{}
		var pk int
		if err := rows.Scan(&cid, &name, &dtype, &notnull, &dflt_value, &pk); err == nil {
			if name == col {
				exists = true
				break
			}
		}
	}

	if !exists {
		_, err = db.Exec("ALTER TABLE " + table + " ADD COLUMN " + col + " " + def)
		if err != nil {
			LogError(fmt.Sprintf("[SQLITE Schema] Error adding column %s to %s: %s", col, table, err))
			return err
		}
	}
	return nil
}

func Db_AppendDesktopSchema() error {
	_db := Db_GetConnection()

	// Ensure foreign keys are enabled for this connection
	_, _ = _db.Exec("PRAGMA foreign_keys = ON;")

	// 1. Create new tables if they don't exist
	// Refactored to use inline (column-level) FOREIGN KEY constraints for better compatibility
	sqlStatements := []string{
		`CREATE TABLE IF NOT EXISTS Collections (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
			name TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS Lobbies (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			save_data_id INTEGER NOT NULL REFERENCES SaveDatas(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			chapter_sid TEXT REFERENCES Chapters(sid) ON DELETE SET NULL,
			icon_img_path TEXT
		);`,
		`CREATE TABLE IF NOT EXISTS CollectionCampaigns (
			collection_id INTEGER NOT NULL REFERENCES Collections(id) ON DELETE CASCADE,
			campaign_id INTEGER NOT NULL REFERENCES Campaigns(id) ON DELETE CASCADE,
			PRIMARY KEY (collection_id, campaign_id)
		);`,
	}

	for _, stmt := range sqlStatements {
		_, err := _db.Exec(stmt)
		if err != nil {
			LogError(fmt.Sprintf("[SQLITE Schema] Error creating table: %s", err))
			return err
		}
	}

	// 3. Append columns to existing tables
	// Campaigns: lobby_id, cover_img_path
	if err := db_addColumn(_db, "Campaigns", "lobby_id", "INTEGER REFERENCES Lobbies(id) ON DELETE SET NULL"); err != nil {
		return err
	}
	if err := db_addColumn(_db, "Campaigns", "cover_img_path", "TEXT"); err != nil {
		return err
	}

	// Chapters: icon_img_path, endscreen_img_path
	if err := db_addColumn(_db, "Chapters", "icon_img_path", "TEXT"); err != nil {
		return err
	}
	if err := db_addColumn(_db, "Chapters", "endscreen_img_path", "TEXT"); err != nil {
		return err
	}

	return nil
}
