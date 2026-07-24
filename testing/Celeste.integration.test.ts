// NODE.JS/BUN/DENO ONLY
import { describe, expect, test } from "bun:test";
import { IFileSystem_Token } from "../src/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../src/interfaces/IFileSystem";
import Celeste from "../src/libs/Celeste";
import { FakeOsPathOverride } from "./helpers/FakeOsPathOverride";
import { GetDependency, TEST_CELESTE_PATH } from "./setup";

describe("Celeste Integration Tests", () => {
	test("GetInstallationPath resolves via override to TEST_CELESTE_PATH (happy path)", async () => {
		const celeste = GetDependency(Celeste);
		const installation = await celeste.GetInstallationPath();
		expect(installation).not.toBeNull();
		expect(installation?.foundPath).toBe(TEST_CELESTE_PATH);
		expect(installation?.installationType).toBe("steam");
	});

	test("GetInstallationPath returns null when override points to a non-existent / empty path", async () => {
		const fs = GetDependency<IFileSystem>(IFileSystem_Token);
		const fakeOs = new FakeOsPathOverride({ CTD_TEST_CELESTE_PATH: "C:/non/existent/path" });
		const celeste = new Celeste(fakeOs, fs);

		const installation = await celeste.GetInstallationPath();
		expect(installation).toBeNull();
	});

	test("GetAllSaveSlots against real fixture Saves/ returns the 4 real slots with correct names", async () => {
		const celeste = GetDependency(Celeste);
		const slots = await celeste.GetAllSaveSlots();
		expect(slots.length).toBe(4);

		expect(slots[0].slotNumber).toBe(0);
		expect(slots[0].slotName).toBe("Krischan");

		expect(slots[1].slotNumber).toBe(1);
		expect(slots[2].slotNumber).toBe(2);
		expect(slots[3].slotNumber).toBe(3);
	});

	test("ReadVanillaSaveStats on real 0.celeste matches known-good values", async () => {
		const celeste = GetDependency(Celeste);
		const slots = await celeste.GetAllSaveSlots();
		expect(slots.length).toBeGreaterThan(0);

		const stats = await celeste.ReadVanillaSaveStats(slots[0].fileAbsolutePath);
		expect(stats).not.toBeNull();
		expect(stats?.name).toBe("Krischan");
		expect(stats?.totalDeaths).toBe(45566);
		expect(stats?.totalStrawberries).toBe(198);
		expect(stats?.totalGoldenStrawberries).toBe(45);
		expect(stats?.unlockedAreas).toBe(10);
	});
});
