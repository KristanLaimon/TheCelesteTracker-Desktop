import * as fs from "node:fs";
import { filesystem } from "@neutralinojs/lib";
import { Logger } from "tslog";

const APP_NAME = "TheCelesteTracker";
const LOG_DIR = "./logs";
const LOG_FILE = `${LOG_DIR}/celeste-hub.log`;

// Helper function to format objects / primitives into human-readable string
function formatArg(arg: unknown): string {
	if (typeof arg === "string") return arg;
	if (arg instanceof Error) return arg.stack || arg.message;
	try {
		return JSON.stringify(arg);
	} catch {
		return String(arg);
	}
}

// Environment-aware persistent file appender
function appendToLogFile(line: string): void {
	// Node/Bun environment (tests, scripts, server)
	if (typeof process !== "undefined" && process.versions && (process.versions.node || process.versions.bun)) {
		try {
			if (!fs.existsSync(LOG_DIR)) {
				fs.mkdirSync(LOG_DIR, { recursive: true });
			}
			fs.appendFileSync(LOG_FILE, `${line}\n`);
			return;
		} catch {
			// Fall back to Neutralino filesystem wrapper if Node fs fails
		}
	}

	// Neutralino webview environment
	if (typeof window !== "undefined") {
		filesystem.appendFile(LOG_FILE, `${line}\n`).catch(() => {
			// Fail silently if filesystem isn't mounted yet
		});
	}
}

export const logger = new Logger({
	name: APP_NAME,
});

// Attach file transport to write logs to ./logs/celeste-hub.log without deleting existing entries
logger.attachTransport((logObj) => {
	const meta = logObj._logMeta;
	const dateStr = meta?.date ? new Date(meta.date).toISOString() : new Date().toISOString();
	const level = meta?.logLevelName ?? "INFO";
	const loggerName = meta?.name ?? APP_NAME;

	// Extract numeric arguments (logObj[0], logObj[1], etc.)
	const args: string[] = [];
	let i = 0;
	while (i in logObj) {
		args.push(formatArg(logObj[i]));
		i++;
	}

	const formattedLine = `[${dateStr}] [${level}] [${loggerName}] ${args.join(" ")}`;
	appendToLogFile(formattedLine);
});

// Domain-specific sub-loggers
export const modScannerLogger = logger.getSubLogger({ name: "ModScanner" });
export const dbLogger = logger.getSubLogger({ name: "Database" });
export const apiLogger = logger.getSubLogger({ name: "API" });