package src

import (
	"encoding/json"
	"errors"
	"os"
)

func FileExists(path string) bool {
	_, err := os.Stat(path)
	if err == nil {
		return true
	} else if errors.Is(err, os.ErrNotExist) {
		return false
	} else {
		//File may or may not exist (permission error, etc.)
		return false
	}
}

func EnsureFileExists(path string) {
	if FileExists(path) {
		return
	} else {
		os.Create(path)
	}
}

func WriteToFileAsText(path string, textContent string) error {
  EnsureFileExists(path)

  err := os.WriteFile(path, []byte(textContent), 0666)
  if err != nil {
    return err
  }

  return nil
}

func WriteToFileAsJson(path string, anything any) error {
	EnsureFileExists(path)

	textBytes, err := json.Marshal(anything)

	if err != nil {
		return err
	}

	errr := os.WriteFile(path, textBytes, 0666)
	if errr != nil {
		return errr
	}

	return nil
}

func WriteTextLnToFile(path string, text string) error {
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	if _, err := f.WriteString(text + "\n"); err != nil {
		return err
	}

	return nil
}

func ReadFileToObject(path string, containerToReadRef any) error {
	var err error = nil

	contentBytes, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	err = json.Unmarshal(contentBytes, containerToReadRef)
	if err != nil {
		return err
	}

	return nil
}


func DeleteFileContent(path string) {
  WriteToFileAsText(path, "")
}