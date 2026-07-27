import { describe, expect, test } from "bun:test";
import { formatFormattedTime, formatPlayTime } from "./Time";

describe("Time utility functions", () => {
	describe("formatPlayTime", () => {
		test("handles 0 or negative numbers", () => {
			expect(formatPlayTime(0)).toBe("0s");
			expect(formatPlayTime(-100)).toBe("0s");
			expect(formatPlayTime(Number.NaN)).toBe("0s");
		});

		test("formats seconds only", () => {
			expect(formatPlayTime(45000)).toBe("45s");
			expect(formatPlayTime(999)).toBe("0s");
			expect(formatPlayTime(5000)).toBe("5s");
		});

		test("formats minutes and seconds", () => {
			expect(formatPlayTime(125000)).toBe("2m 05s");
			expect(formatPlayTime(60000)).toBe("1m 00s");
		});

		test("formats hours, minutes, and seconds", () => {
			expect(formatPlayTime(4500000)).toBe("1h 15m 00s");
			expect(formatPlayTime(3600000)).toBe("1h 00m 00s");
			expect(formatPlayTime(3665000)).toBe("1h 01m 05s");
		});
	});

	describe("formatFormattedTime", () => {
		test("handles 0 or invalid input", () => {
			expect(formatFormattedTime(0)).toBe("0:00.000");
			expect(formatFormattedTime(-50)).toBe("0:00.000");
		});

		test("formats minutes, seconds, and milliseconds", () => {
			expect(formatFormattedTime(125432)).toBe("2:05.432");
		});

		test("formats hours, minutes, and seconds when >= 1 hour", () => {
			expect(formatFormattedTime(3725432)).toBe("1:02:05");
		});
	});
});
