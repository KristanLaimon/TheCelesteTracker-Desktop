package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/websocket"
)

var (
	nlPort         string
	nlToken        string
	nlExtensionId  string
	nlConnectToken string
)

type Config struct {
	NlPort         interface{} `json:"nlPort"`
	NlToken        string      `json:"nlToken"`
	NlExtensionId  string      `json:"nlExtensionId"`
	NlConnectToken string      `json:"nlConnectToken"`
}

type ExtensionRequest struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

type BroadcastPayload struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

type NeutralinoBroadcast struct {
	Id          string           `json:"id"`
	Method      string           `json:"method"`
	AccessToken string           `json:"accessToken"`
	Data        BroadcastPayload `json:"data"`
}

func writeLog(format string, args ...interface{}) {
	f, err := os.OpenFile("utilities_extension.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err == nil {
		defer f.Close()
		fmt.Fprintf(f, format, args...)
	}
}

func main() {
	log.SetOutput(io.Discard) // Mute standard logger to avoid stdout noise

	writeLog("[INFO] Utilities Go extension starting up...\n")

	// Read standard input config
	var config Config
	if err := json.NewDecoder(os.Stdin).Decode(&config); err != nil {
		writeLog("[ERROR] Failed to decode config from stdin: %v\n", err)
		os.Exit(1)
	}

	nlPort = fmt.Sprintf("%v", config.NlPort)
	nlToken = config.NlToken
	nlExtensionId = config.NlExtensionId
	nlConnectToken = config.NlConnectToken

	writeLog("[DEBUG] Configuration parsed: port=%s, ext_id=%s\n", nlPort, nlExtensionId)

	// Connect to WebSocket server
	wsURL := fmt.Sprintf("ws://127.0.0.1:%s/?extensionId=%s&connectToken=%s", nlPort, nlExtensionId, nlConnectToken)
	writeLog("[INFO] Connecting to Neutralino at: %s\n", wsURL)

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		writeLog("[ERROR] WebSocket connection failed: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close()

	writeLog("[INFO] Connected to NeutralinoJS successfully\n")

	// Event loop
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			writeLog("[ERROR] Read error: %v. Exiting...\n", err)
			break
		}

		writeLog("[DEBUG] WebSocket msg received: %s\n", string(message))

		var req ExtensionRequest
		if err := json.Unmarshal(message, &req); err != nil {
			writeLog("[ERROR] Failed to parse message: %v\n", err)
			continue
		}

		if req.Event == "appClientDisconnect" {
			writeLog("[INFO] appClientDisconnect received. Exiting...\n")
			break
		}

		go handleRequest(conn, req)
	}

	writeLog("[INFO] Utilities Go extension shutting down...\n")
}

func handleRequest(conn *websocket.Conn, req ExtensionRequest) {
	dataMap, _ := req.Data.(map[string]interface{})
	if dataMap == nil {
		dataMap = make(map[string]interface{})
	}
	reqId, _ := dataMap["reqId"].(string)

	switch req.Event {
	case "zip.readTextFile":
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

	case "zip.list":
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

	case "zip.unzip":
		zipPath, _ := dataMap["zipPath"].(string)
		destPath, _ := dataMap["destPath"].(string)
		err := unzip(zipPath, destPath)
		if err != nil {
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
			"reqId": reqId,
			"result": map[string]interface{}{
				"success": true,
			},
		})

	case "zip.zip":
		srcPath, _ := dataMap["srcPath"].(string)
		zipPath, _ := dataMap["zipPath"].(string)
		err := zipFolder(srcPath, zipPath)
		if err != nil {
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
			"reqId": reqId,
			"result": map[string]interface{}{
				"success": true,
			},
		})

	default:
		writeLog("[WARN] Unhandled event: %s\n", req.Event)
	}
}

func sendBroadcast(conn *websocket.Conn, eventName string, responsePayload interface{}) {
	broadcast := NeutralinoBroadcast{
		Id:          "uuid-placeholder",
		Method:      "app.broadcast",
		AccessToken: nlToken,
		Data: BroadcastPayload{
			Event: eventName,
			Data:  responsePayload,
		},
	}

	data, err := json.Marshal(broadcast)
	if err != nil {
		writeLog("[ERROR] Failed to marshal broadcast: %v\n", err)
		return
	}

	writeLog("[DEBUG] Sending response to app: %s\n", string(data))
	if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
		writeLog("[ERROR] WebSocket write error: %v\n", err)
	}
}

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

	err = filepath.Walk(srcPath, func(path string, info os.FileInfo, err error) error {
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

	return err
}
