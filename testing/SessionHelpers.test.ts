import { describe, expect, test } from "bun:test";
import { formatChapterName, formatRelativeTime, formatSessionDate, formatSideName } from "../src/libs/SessionHelpers";

describe("SessionHelpers", () => {
	describe("formatRelativeTime", () => {
		test("formats relative time correctly", () => {
			const now = new Date("2026-07-27T12:00:00.000Z");

			expect(formatRelativeTime("2026-07-27T11:59:30.000Z", { now })).toBe("just now");
			expect(formatRelativeTime("2026-07-27T11:45:00.000Z", { now })).toBe("15 mins ago");
			expect(formatRelativeTime("2026-07-27T09:00:00.000Z", { now })).toBe("3 hours ago");
			expect(formatRelativeTime("2026-07-24T12:00:00.000Z", { now })).toBe("3 days ago");
			expect(formatRelativeTime("2026-06-15T12:00:00.000Z", { now })).toBe("1 month ago");
		});
	});

	describe("formatSessionDate", () => {
		test("handles null or undefined or invalid dates", () => {
			expect(formatSessionDate(null)).toBe("—");
			expect(formatSessionDate(undefined)).toBe("—");
			expect(formatSessionDate("invalid-date")).toBe("—");
		});

		test("formats valid date with human name and relative time", () => {
			const now = new Date("2026-07-27T12:00:00.000Z");
			const dateStr = "2026-07-24T10:00:00.000Z";
			const formatted = formatSessionDate(dateStr, { now });
			expect(formatted).toContain("Jul 24, 2026");
			expect(formatted).toContain("3 days ago");
		});

		test("formats valid date without relative time when opts.includeRelative is false", () => {
			const now = new Date("2026-07-27T12:00:00.000Z");
			const dateStr = "2026-07-24T10:00:00.000Z";
			const formatted = formatSessionDate(dateStr, { includeRelative: false, now });
			expect(formatted).not.toContain("ago");
			expect(formatted).toContain("Jul 24, 2026");
		});
	});

	describe("formatSideName", () => {
		test("normalizes side names", () => {
			expect(formatSideName("SIDEA")).toBe("A-Side");
			expect(formatSideName("0")).toBe("A-Side");
			expect(formatSideName("A")).toBe("A-Side");
			expect(formatSideName("SIDEB")).toBe("B-Side");
			expect(formatSideName("1")).toBe("B-Side");
			expect(formatSideName("B")).toBe("B-Side");
			expect(formatSideName("SIDEC")).toBe("C-Side");
			expect(formatSideName("2")).toBe("C-Side");
			expect(formatSideName("C")).toBe("C-Side");
			expect(formatSideName("CustomSide")).toBe("CustomSide");
			expect(formatSideName(null)).toBe("A-Side");
		});
	});

	describe("formatChapterName", () => {
		test("extracts chapter name from SID", () => {
			expect(formatChapterName("BeefyUncleTorre/map")).toBe("map");
			expect(formatChapterName("Celeste/1-ForsakenCity")).toBe("1-ForsakenCity");
			expect(formatChapterName("SimpleChapter")).toBe("SimpleChapter");
			expect(formatChapterName(null)).toBe("—");
		});
	});
});
