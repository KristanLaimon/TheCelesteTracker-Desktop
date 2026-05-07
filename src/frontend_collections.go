package src

import "fmt"

type Collection struct {
	Id     int    `db:"id" json:"id"`
	Name   string `db:"name" json:"name"`
	UserId int    `db:"user_id" json:"userId"`
}

// FULL CRUD: Create, Read, Update and Delete
func Collection_Insert(userId int, name string) (int64, error) {
	res, err := Db_Exec(`INSERT INTO Collections (user_id, name) VALUES(?, ?)`, userId, name)

	if err != nil {
		LogError(err.Error())
		return 0, err
	}

	return res.LastIdInserted, nil
}

func Collection_Update(collectionId int, newName string) error {
	_, err := Db_Exec(`UPDATE Collections SET name = ? WHERE id = ?`, newName, collectionId)

	if err != nil {
		LogError(err.Error())
		return err
	}

	return nil
}

func Collection_Delete(collectionId int) error {
	_, err := Db_Exec(`DELETE FROM Collections WHERE id = ?`, collectionId)

	if err != nil {
		LogError(err.Error())
		return err
	}

	return nil
}

func Collection_Get(collectionId int) (Collection, error) {
	var toReturn []Collection
	err := Db_Select(&toReturn, `SELECT id, user_id, name FROM Collections WHERE id = ? LIMIT 1`, collectionId)

	if err != nil {
		return Collection{}, err
	}

	if len(toReturn) == 0 {
		return Collection{}, fmt.Errorf("collection not found")
	}

	return toReturn[0], nil
}

func Collection_List(userId int) ([]Collection, error) {
	toReturn := make([]Collection, 0)
	err := Db_Select(&toReturn, `SELECT id, user_id, name FROM Collections WHERE user_id = ?`, userId)

	if err != nil {
		return nil, err
	}

	return toReturn, nil
}
