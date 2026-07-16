package main

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/websocket"
)

// ─────────────────────────────────────────────────────────────────────────────
// Event handlers
// ─────────────────────────────────────────────────────────────────────────────

func handleZipReadTextFile(conn *websocket.Conn, reqId string, dataMap map[string]interface{}) {
	zipPath, _ := dataMap["zipPath"].(string)
	filePath, _ := dataMap["filePath"].(string)

	content, err := zipReadTextFile(zipPath, filePath)
	if err != nil {
		sendBroadcast(conn, "zip.readTextFileResult", map[string]interface{}{
			"reqId": reqId,
			"result": map[string]interface{}{
				"success": false,
				"error":   err.Error(),
			},
		})
		return
	}
	sendBroadcast(conn, "zip.readTextFileResult", map[string]interface{}{
		"reqId": reqId,
		"result": map[string]interface{}{
			"success": true,
			"content": content,
		},
	})
}

func handleZipList(conn *websocket.Conn, reqId string, dataMap map[string]interface{}) {
	zipPath, _ := dataMap["zipPath"].(string)

	files, err := zipList(zipPath)
	if err != nil {
		sendBroadcast(conn, "zip.listResult", map[string]interface{}{
			"reqId": reqId,
			"result": map[string]interface{}{
				"success": false,
				"error":   err.Error(),
			},
		})
		return
	}
	sendBroadcast(conn, "zip.listResult", map[string]interface{}{
		"reqId": reqId,
		"result": map[string]interface{}{
			"success": true,
			"files":   files,
		},
	})
}

func handleZipUnzip(conn *websocket.Conn, reqId string, dataMap map[string]interface{}) {
	zipPath, _ := dataMap["zipPath"].(string)
	destPath, _ := dataMap["destPath"].(string)

	if err := unzip(zipPath, destPath); err != nil {
		sendBroadcast(conn, "zip.unzipResult", map[string]interface{}{
			"reqId": reqId,
			"result": map[string]interface{}{
				"success": false,
				"error":   err.Error(),
			},
		})
		return
	}
	sendBroadcast(conn, "zip.unzipResult", map[string]interface{}{
		"reqId":  reqId,
		"result": map[string]interface{}{"success": true},
	})
}

func handleZipZip(conn *websocket.Conn, reqId string, dataMap map[string]interface{}) {
	srcPath, _ := dataMap["srcPath"].(string)
	zipPath, _ := dataMap["zipPath"].(string)

	if err := zipFolder(srcPath, zipPath); err != nil {
		sendBroadcast(conn, "zip.zipResult", map[string]interface{}{
			"reqId": reqId,
			"result": map[string]interface{}{
				"success": false,
				"error":   err.Error(),
			},
		})
		return
	}
	sendBroadcast(conn, "zip.zipResult", map[string]interface{}{
		"reqId":  reqId,
		"result": map[string]interface{}{"success": true},
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// Zip operations
// ─────────────────────────────────────────────────────────────────────────────

func zipReadTextFile(zipPath, filePath string) (string, error) {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return "", err
	}
	defer r.Close()

	targetName := strings.ToLower(filePath)
	for _, f := range r.File {
		if strings.ToLower(f.Name) == targetName {
			rc, err := f.Open()
			if err != nil {
				return "", err
			}
			defer rc.Close()

			content, err := io.ReadAll(rc)
			if err != nil {
				return "", err
			}
			return string(content), nil
		}
	}

	return "", fmt.Errorf("file not found in zip: %s", filePath)
}

func zipList(zipPath string) ([]string, error) {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, err
	}
	defer r.Close()

	var files []string
	for _, f := range r.File {
		files = append(files, f.Name)
	}
	return files, nil
}

func unzip(zipPath, destPath string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		fpath := filepath.Join(destPath, f.Name)

		if !strings.HasPrefix(fpath, filepath.Clean(destPath)+string(os.PathSeparator)) {
			return fmt.Errorf("illegal file path in zip: %s", f.Name)
		}

		if f.FileInfo().IsDir() {
			os.MkdirAll(fpath, os.ModePerm)
			continue
		}

		if err := os.MkdirAll(filepath.Dir(fpath), os.ModePerm); err != nil {
			return err
		}

		outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return err
		}

		rc, err := f.Open()
		if err != nil {
			outFile.Close()
			return err
		}

		_, err = io.Copy(outFile, rc)
		outFile.Close()
		rc.Close()
		if err != nil {
			return err
		}
	}
	return nil
}

func zipFolder(srcPath, zipPath string) error {
	archive, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer archive.Close()

	writer := zip.NewWriter(archive)
	defer writer.Close()

	return filepath.Walk(srcPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(srcPath, path)
		if err != nil {
			return err
		}

		if relPath == "." {
			return nil
		}

		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}

		header.Name = filepath.ToSlash(relPath)

		if info.IsDir() {
			header.Name += "/"
		} else {
			header.Method = zip.Deflate
		}

		writerEntry, err := writer.CreateHeader(header)
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		_, err = io.Copy(writerEntry, file)
		return err
	})
}
