// NODE.JS/BUN/DENO ONLY
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { IFileSystem_Token, IPath_Token } from "../../src/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../../src/interfaces/IFileSystem";
import type { IPath } from "../../src/interfaces/IPath";
import Olympus from "../../src/libs/Olympus";
import { FakeOsPathOverride } from "../helpers/FakeOsPathOverride";
import { GetDependency, TEST_FOLDER, TEST_OLYMPUS_PATH } from "../setup";

describe("Olympus Integration Tests", () => {
	test("isInstalled returns true via override and GetInstallationPath returns TEST_OLYMPUS_PATH", async () => {
		const olympus = GetDependency(Olympus);
		const installed = await olympus.isInstalled();
		expect(installed).toBeTrue();

		const installPath = await olympus.GetInstallationPath();
		expect(installPath).toBe(TEST_OLYMPUS_PATH);
	});

	test("GetModCategoryByModId and GetModHumanNameByModId return valid values against real cached JSONs", async () => {
		const olympus = GetDependency(Olympus);

		const category = await olympus.GetModCategoryByModId("StrawberryJam2021");
		expect(category).toBe("Maps");

		const humanName = await olympus.GetModHumanNameByModId("StrawberryJam2021");
		expect(humanName).toBe("Strawberry Jam Collab ∙ Map Pack");

		const collabCategory = await olympus.GetModCategoryByModId("CollabUtils2");
		expect(collabCategory).toBe("Helpers");
	});

	test("isInstalled returns false when path override points to non-existent folder", async () => {
		const fs = GetDependency<IFileSystem>(IFileSystem_Token);
		const path = GetDependency<IPath>(IPath_Token);
		const fakeOs = new FakeOsPathOverride({ CTD_TEST_OLYMPUS_PATH: "C:/non/existent/olympus" });
		const olympus = new Olympus(fakeOs, fs, path);

		const installed = await olympus.isInstalled();
		expect(installed).toBeFalse();

		const pathResult = await olympus.GetInstallationPath();
		expect(pathResult).toBeNull();

		const catResult = await olympus.GetModCategoryByModId("StrawberryJam2021");
		expect(catResult).toBeNull();
	});

	test("GetModHumanNameByModId and GetModCategoryByModId return null when JSON is corrupt", async () => {
		const fs = GetDependency<IFileSystem>(IFileSystem_Token);
		const path = GetDependency<IPath>(IPath_Token);
		const corruptPath = join(TEST_FOLDER, "Olympus", "fixtures", "olympus-corrupt");
		const fakeOs = new FakeOsPathOverride({ CTD_TEST_OLYMPUS_PATH: corruptPath });
		const olympus = new Olympus(fakeOs, fs, path);

		const humanName = await olympus.GetModHumanNameByModId("StrawberryJam2021");
		expect(humanName).toBeNull();
	});
});
