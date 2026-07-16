package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"

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

// ─────────────────────────────────────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────────────────────────────────────

func writeLog(format string, args ...interface{}) {
	f, err := os.OpenFile("utilities_extension.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err == nil {
		defer f.Close()
		fmt.Fprintf(f, format, args...)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

func main() {
	log.SetOutput(io.Discard) // Mute standard logger to avoid stdout noise

	writeLog("[INFO] Utilities Go extension starting up...\n")

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

	wsURL := fmt.Sprintf("ws://127.0.0.1:%s/?extensionId=%s&connectToken=%s", nlPort, nlExtensionId, nlConnectToken)
	writeLog("[INFO] Connecting to Neutralino at: %s\n", wsURL)

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		writeLog("[ERROR] WebSocket connection failed: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close()

	writeLog("[INFO] Connected to NeutralinoJS successfully\n")

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

		if req.Event == "appClientDisconnect" || req.Event == "appClose" {
			writeLog("[INFO] %s received. Exiting...\n", req.Event)
			break
		}

		go handleRequest(conn, req)
	}

	writeLog("[INFO] Utilities Go extension shutting down...\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// Request routing
// ─────────────────────────────────────────────────────────────────────────────

func handleRequest(conn *websocket.Conn, req ExtensionRequest) {
	dataMap, _ := req.Data.(map[string]interface{})
	if dataMap == nil {
		dataMap = make(map[string]interface{})
	}
	reqId, _ := dataMap["reqId"].(string)

	switch req.Event {
	case "executeSql":
		handleExecuteSql(conn, reqId, dataMap)
	case "zip.readTextFile":
		handleZipReadTextFile(conn, reqId, dataMap)
	case "zip.list":
		handleZipList(conn, reqId, dataMap)
	case "zip.unzip":
		handleZipUnzip(conn, reqId, dataMap)
	case "zip.zip":
		handleZipZip(conn, reqId, dataMap)
	default:
		writeLog("[WARN] Unhandled event: %s\n", req.Event)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket broadcast helper
// ─────────────────────────────────────────────────────────────────────────────

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
