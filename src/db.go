package src

import (
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

var db *sqlx.DB;
var alreadyConnected bool = false

func Db_GetConnection() *sqlx.DB {
	if (alreadyConnected){
		return db
	}

	celesteModDbPath, err := GetCelesteModTrackerDatabasePath()

	if err != nil {
		log.Fatalln(err)
	}

	_db, err := sqlx.Open("sqlite3", "file:"+celesteModDbPath)

	if err != nil {
		log.Fatalln(err)
	}

	db = _db
	alreadyConnected = true
	return db
}

func Db_DoQuery(typeToConvert any, query string, args ...any) error {
	_db := Db_GetConnection()

	err := _db.Select(typeToConvert, query, args...);

	if err != nil {
		log.Printf("[SQLITE Query] Error: %s", err)
		return err
	}

	return nil
}

func Db_AppendDesktopSchema() error {
	_db := Db_GetConnection()

	// 1. Create new tables if they don't exist
	sqlStatements := []string{
		`CREATE TABLE IF NOT EXISTS Collections (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES Users(id)
		);`,
		`CREATE TABLE IF NOT EXISTS Lobbies (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			save_data_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			chapter_sid TEXT,
			icon_img_path TEXT,
			FOREIGN KEY (save_data_id) REFERENCES SaveDatas(id),
			FOREIGN KEY (chapter_sid) REFERENCES Chapters(sid)
		);`,
		`CREATE TABLE IF NOT EXISTS CollectionCampaigns (
			collection_id INTEGER NOT NULL,
			campaign_id INTEGER NOT NULL,
			PRIMARY KEY (collection_id, campaign_id),
			FOREIGN KEY (collection_id) REFERENCES Collections(id),
			FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
		);`,
	}

	for _, stmt := range sqlStatements {
		_, err := _db.Exec(stmt)
		if err != nil {
			log.Printf("[SQLITE Schema] Error creating table: %s", err)
			return err
		}
	}

	// 2. Helper to add column if it doesn't exist (SQLite ALTER TABLE doesn't support IF NOT EXISTS)
	addColumn := func(table, col, def string) error {
		rows, err := _db.Query("PRAGMA table_info(" + table + ")")
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
			_, err = _db.Exec("ALTER TABLE " + table + " ADD COLUMN " + col + " " + def)
			if err != nil {
				log.Printf("[SQLITE Schema] Error adding column %s to %s: %s", col, table, err)
				return err
			}
		}
		return nil
	}

	// 3. Append columns to existing tables
	// Campaigns: lobby_id, cover_img_path
	if err := addColumn("Campaigns", "lobby_id", "INTEGER REFERENCES Lobbies(id)"); err != nil {
		return err
	}
	if err := addColumn("Campaigns", "cover_img_path", "TEXT"); err != nil {
		return err
	}

	// Chapters: icon_img_path, endscreen_img_path
	if err := addColumn("Chapters", "icon_img_path", "TEXT"); err != nil {
		return err
	}
	if err := addColumn("Chapters", "endscreen_img_path", "TEXT"); err != nil {
		return err
	}

	return nil
}
