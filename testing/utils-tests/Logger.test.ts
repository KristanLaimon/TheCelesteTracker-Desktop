import { describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import { apiLogger, dbLogger, logger, modScannerLogger } from "../../src/utils/Logger";

describe("tslog Logger with persistent file logging", () => {
	const logFile = "./logs/celeste-hub.log";

	it("should log info, warn, and error messages", () => {
		logger.info("Test main logger info");
		logger.warn("Test main logger warn");
		logger.error("Test main logger error");

		modScannerLogger.info("Test mod scanner info");
		dbLogger.error("Test db logger error");
		apiLogger.info("Test api logger info");

		expect(fs.existsSync(logFile)).toBe(true);
		const content = fs.readFileSync(logFile, "utf-8");

		expect(content).toContain("[TheCelesteTracker] Test main logger info");
		expect(content).toContain("[TheCelesteTracker] Test main logger warn");
		expect(content).toContain("[TheCelesteTracker] Test main logger error");
		expect(content).toContain("[ModScanner] Test mod scanner info");
		expect(content).toContain("[Database] Test db logger error");
		expect(content).toContain("[API] Test api logger info");
	});

	it("should append to log file without clearing previous contents across app runs", () => {
		const initialSize = fs.statSync(logFile).size;

		logger.info("App restarted: session check line");

		const newSize = fs.statSync(logFile).size;
		expect(newSize).toBeGreaterThan(initialSize);

		const content = fs.readFileSync(logFile, "utf-8");
		expect(content).toContain("App restarted: session check line");
	});
});
