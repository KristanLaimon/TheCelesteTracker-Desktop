// NODE.JS/BUN/DENO ONLY
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import Celeste from "../src/libs/Celeste";
import { GetDependency, TEST_FOLDER } from "./setup";

const FIXTURES_DIR = join(TEST_FOLDER, "fixtures");

describe("Celeste.ReadVanillaSaveStats", () => {
	test("reads a normal filled save slot", async () => {
		const celeste = GetDependency(Celeste);
		const stats = await celeste.ReadVanillaSaveStats(join(FIXTURES_DIR, "celeste-save-normal.xml"));

		expect(stats).not.toBeNull();
		expect(stats?.name).toBe("Krischan");
		expect(stats?.totalDeaths).toBe(45566);
		expect(stats?.totalStrawberries).toBe(198);
		expect(stats?.totalGoldenStrawberries).toBe(45);
		expect(stats?.totalJumps).toBe(341936);
		expect(stats?.totalWallJumps).toBe(87492);
		expect(stats?.totalDashes).toBe(378534);
		expect(stats?.unlockedAreas).toBe(10);
	});

	test("reads a fresh/empty save slot", async () => {
		const celeste = GetDependency(Celeste);
		const stats = await celeste.ReadVanillaSaveStats(join(FIXTURES_DIR, "celeste-save-empty-recyclebin.xml"));

		expect(stats).not.toBeNull();
		expect(stats?.name).toBe("FreshFile");
		expect(stats?.totalDeaths).toBe(0);
	});

	test("returns null for a nonexistent file", async () => {
		const celeste = GetDependency(Celeste);
		const stats = await celeste.ReadVanillaSaveStats(join(FIXTURES_DIR, "does-not-exist.xml"));
		expect(stats).toBeNull();
	});
});
