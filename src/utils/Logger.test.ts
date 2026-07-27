import { describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import {
	apiLogger,
	celesteLogger,
	coreLogger,
	dbLogger,
	LogLevel,
	layoutLogger,
	logger,
	modScannerLogger,
	olympusLogger,
	setLogLevels,
	uiLogger,
	wanvasLogger,
} from "./Logger";

describe("tslog Logger with persistent file logging and log levels", () => {
	const logFile = "./logs/celeste-hub.log";

	it("should log messages across full spectrum to transport file", () => {
		setLogLevels({ minLevel: LogLevel.SILLY });
		logger.silly("Test main logger silly");
		logger.trace("Test main logger trace");
		logger.debug("Test main logger debug");
		logger.info("Test main logger info");
		logger.warn("Test main logger warn");
		logger.error("Test main logger error");
		logger.fatal("Test main logger fatal");

		modScannerLogger.silly("Test mod scanner silly");
		modScannerLogger.trace("Test mod scanner trace");
		modScannerLogger.info("Test mod scanner info");
		dbLogger.error("Test db logger error");
		apiLogger.info("Test api logger info");
		coreLogger.info("Test core logger info");
		celesteLogger.debug("Test celeste logger debug");
		olympusLogger.trace("Test olympus logger trace");
		wanvasLogger.silly("Test wanvas logger silly");
		uiLogger.info("Test ui logger info");
		layoutLogger.warn("Test layout logger warn");

		expect(fs.existsSync(logFile)).toBe(true);
		const content = fs.readFileSync(logFile, "utf-8");

		expect(content).toContain("[TheCelesteTracker] Test main logger info");
		expect(content).toContain("[TheCelesteTracker] Test main logger warn");
		expect(content).toContain("[TheCelesteTracker] Test main logger error");
		expect(content).toContain("[ModScanner] Test mod scanner info");
		expect(content).toContain("[Database] Test db logger error");
		expect(content).toContain("[API] Test api logger info");

		// Reset back to default WARN
		setLogLevels({ minLevel: LogLevel.WARN });
	});

	it("should append to log file without clearing previous contents across app runs", () => {
		const initialSize = fs.statSync(logFile).size;

		logger.warn("App restarted: session check line");

		const newSize = fs.statSync(logFile).size;
		expect(newSize).toBeGreaterThan(initialSize);

		const content = fs.readFileSync(logFile, "utf-8");
		expect(content).toContain("App restarted: session check line");
	});

	it("should support dynamic log level changes via setLogLevels", () => {
		setLogLevels({ minLevel: LogLevel.SILLY });
		expect(logger.settings.minLevel).toBe(LogLevel.SILLY);
		expect(modScannerLogger.settings.minLevel).toBe(LogLevel.SILLY);

		setLogLevels({ minLevel: LogLevel.WARN });
		expect(logger.settings.minLevel).toBe(LogLevel.WARN);
		expect(modScannerLogger.settings.minLevel).toBe(LogLevel.WARN);
	});
});
