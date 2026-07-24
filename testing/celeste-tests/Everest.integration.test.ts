// NODE.JS/BUN/DENO ONLY
import { describe, expect, test } from "bun:test";
import Everest from "../../src/libs/Everest";
import { GetDependency, TEST_CELESTE_PATH } from "../setup";

describe("Everest Integration Tests", () => {
	test("GetInstallationPath resolves to testing/Celeste/Mods", async () => {
		const everest = GetDependency(Everest);
		const installPath = await everest.GetInstallationPath();
		expect(installPath).toBe(`${TEST_CELESTE_PATH}/Mods`);
	});

	test(
		"GetModsInstalled scans the real zips and finds known installed mods",
		async () => {
			const everest = GetDependency(Everest);
			const mods = await everest.GetModsInstalled();

			expect(mods.length).toBeGreaterThan(0);
			const modNames = mods.map((m) => m.metadata.name);

			expect(modNames).toContain("CollabUtils2");
			expect(modNames).toContain("Anonhelper");
			expect(modNames).toContain("Cateline");
			expect(modNames).toContain("StrawberryFriend");
		},
		{ timeout: 30000 },
	);

	test(
		"GetModsInstalledFull scans full metadata and map/dialog structure for installed mods",
		async () => {
			const everest = GetDependency(Everest);
			const mods = await everest.GetModsInstalledFull();

			expect(mods.length).toBeGreaterThan(0);
			const collabMod = mods.find((m) => m.metadata.name === "CollabUtils2");
			expect(collabMod).toBeDefined();
			expect(collabMod?.metadata.isLobby).toBeFalse();
			expect(collabMod?.metadata.version).toBeDefined();
		},
		{ timeout: 30000 },
	);
});
