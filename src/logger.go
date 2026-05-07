package src

import (
	"fmt"
	"os"
	"time"
)

var log_file_path string = "./log"

func LogClearFile() {
  WriteToFileAsText(log_file_path, "")
}

func LogInfo(message string) {
	nowFormatted := getNowTimeFormatted()
	WriteTextLnToFile(log_file_path, fmt.Sprintf("%s [INFO]: %s", nowFormatted, message))
}

func LogDebug(message string) {
	nowFormatted := getNowTimeFormatted()
	WriteTextLnToFile(log_file_path, fmt.Sprintf("%s [DEBUG]: %s", nowFormatted, message))
}

func LogWarn(message string) {
	nowFormatted := getNowTimeFormatted()
	WriteTextLnToFile(log_file_path, fmt.Sprintf("%s [WARNING]: %s", nowFormatted, message))
}

func LogError(message string) {
	nowFormatted := getNowTimeFormatted()
	WriteTextLnToFile(log_file_path, fmt.Sprintf("%s [ERROR]: %s", nowFormatted, message))
}

func LogFatalError(message string) {
	nowFormatted := getNowTimeFormatted()
	WriteTextLnToFile(log_file_path, fmt.Sprintf("%s [FATAL ERROR]: %s | SHUTTING DOWN", nowFormatted, message))
	os.Exit(1)
}

func getNowTimeFormatted() string {
	now := time.Now()
	nowFormated := now.Format("2006:01:02 15:04:05")
	return nowFormated
}
