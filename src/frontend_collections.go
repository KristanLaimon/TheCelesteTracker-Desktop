package src

type Collection struct {
	Id     int    `db:"id"`
	Name   string `db:"name"`
	UserId int    `db:"user_id"`
}

// FULL CRUD: Create, Read, Update and Delete
func Collection_Insert(userId int, newName string) bool {
	res, err := Db_Exec(`INSERT INTO Collections (user_id, name) VALUES(%d, %s)`, userId, newName)

	if err != nil {
		LogError(err.Error())
		return false
	}

	return res.RowsAffected == 1
}

func Collection_Modify(userId int, oldName string, newName string) bool {

	res, err := Db_Exec(`UPDATE Collections c 
    SET c.name = '%s'
    WHERE c.name = '%s' and c.user_id = %d
  `, newName, oldName, userId)

	if err != nil {
		LogError(err.Error())
		return false
	}

	return res.RowsAffected == 1
}

func Collection_Delete(userId int, name string) bool {
	res, err := Db_Exec(`DELETE FROM Collections where user_id = %d and name = %s`, userId, name)

	if err != nil {
		LogError(err.Error())
		return false
	}

	return res.RowsAffected == 1
}

func Collection_Get(userId int, name string) (Collection, error) {
	toReturn := Collection{}

	err := Db_Select(&toReturn, `SELECT COUNT(id) FROM Collections
    WHERE name = '%s' and user_id = %d;`, name, userId)

	if err != nil {
		LogError(err.Error())
		return Collection{}, nil
	}

	return toReturn, nil
}
