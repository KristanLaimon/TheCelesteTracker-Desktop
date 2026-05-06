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
