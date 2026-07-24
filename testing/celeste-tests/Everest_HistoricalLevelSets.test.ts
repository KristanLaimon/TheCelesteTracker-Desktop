// NODE.JS/BUN/DENO ONLY

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import Everest, { type EverestModInfo, GetLevelSetNamesForMod } from "../../src/libs/Everest";
import { GetDependency, TEST_FOLDER } from "../setup";

const FIXTURES_DIR = join(TEST_FOLDER, "Celeste", "fixtures");

describe("Everest.ReadHistoricalLevelSetNames", () => {
	test("reads installed + recycled LevelSets from a normal save", async () => {
		const everest = GetDependency(Everest);
		const result = await everest.ReadHistoricalLevelSetNames(join(FIXTURES_DIR, "celeste-save-normal.xml"));

		expect(result.installedLevelSetNames).toEqual(["Celeste", "BreezeContest2024/0-Lobbies"]);
		expect(result.recycledLevelSetNames).toEqual(["AliceQuasar/Binary"]);
	});

	test("handles an empty self-closing <LevelSetRecycleBin />", async () => {
		const everest = GetDependency(Everest);
		const result = await everest.ReadHistoricalLevelSetNames(join(FIXTURES_DIR, "celeste-save-empty-recyclebin.xml"));

		expect(result.installedLevelSetNames).toEqual([]);
		expect(result.recycledLevelSetNames).toEqual([]);
	});

	test("handles exactly one LevelSetStats in the recycle bin (array-collapse case)", async () => {
		const everest = GetDependency(Everest);
		const result = await everest.ReadHistoricalLevelSetNames(join(FIXTURES_DIR, "celeste-save-single-recycled.xml"));

		expect(result.recycledLevelSetNames).toEqual(["SoloMod/Campaign"]);
	});

	test("returns empty arrays for a nonexistent file", async () => {
		const everest = GetDependency(Everest);
		const result = await everest.ReadHistoricalLevelSetNames(join(FIXTURES_DIR, "does-not-exist.xml"));

		expect(result.installedLevelSetNames).toEqual([]);
		expect(result.recycledLevelSetNames).toEqual([]);
	});
});

describe("GetLevelSetNamesForMod", () => {
	test("standalone mod: uses campaigns[].campaignNameId", () => {
		const mod: EverestModInfo = {
			fileName: "berry143.zip",
			isZip: true,
			modPath: "/mods/berry143.zip",
			humanName: "Berry 143",
			metadata: {
				name: "berry143",
				version: "1.0.0",
				dependencies: [],
				isLobby: false,
				chapters: [],
				campaigns: [{ campaignNameId: "bryse0n/berry143", maps: [] }],
			},
		};

		expect(GetLevelSetNamesForMod(mod)).toEqual(["bryse0n/berry143"]);
	});

	test("collab mod: prefixes lobbyId with collabId", () => {
		const mod: EverestModInfo = {
			fileName: "BreezeContest2024.zip",
			isZip: true,
			modPath: "/mods/BreezeContest2024.zip",
			humanName: "Breeze Contest 2024",
			metadata: {
				name: "BreezeContest2024",
				version: "1.0.0",
				dependencies: [],
				isLobby: true,
				lobbyChapters: [],
				collabId: "BreezeContest2024",
				lobbies: [{ lobbyId: "0-Lobbies", maps: [] }],
				gyms: [],
			},
		};

		expect(GetLevelSetNamesForMod(mod)).toEqual(["BreezeContest2024/0-Lobbies"]);
	});

	test("returns empty array when metadata has no campaigns/lobbies", () => {
		const mod: EverestModInfo = {
			fileName: "empty.zip",
			isZip: true,
			modPath: "/mods/empty.zip",
			humanName: "Empty",
			metadata: { name: "", version: "", dependencies: [], isLobby: false, chapters: [], campaigns: [] },
		};

		expect(GetLevelSetNamesForMod(mod)).toEqual([]);
	});
});
