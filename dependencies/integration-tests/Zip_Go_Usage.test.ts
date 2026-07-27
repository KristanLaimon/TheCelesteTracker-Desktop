// NODE.JS/BUN/DENO ONLY
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { GetDependency, TEST_TEMP_FOLDER } from "../../testing/setup";
import Zip_Go from "../exports/Zip_Go";

const TMP_DIR = join(TEST_TEMP_FOLDER, "temp_zip_usage");

describe("Zip_Go via DI (Mod Scanning)", () => {
	let zip: Zip_Go;

	beforeAll(() => {
		zip = GetDependency(Zip_Go);
		rmSync(TMP_DIR, { recursive: true, force: true });
		mkdirSync(TMP_DIR, { recursive: true });
	});

	afterAll(() => {
		if (existsSync(TMP_DIR)) {
			rmSync(TMP_DIR, { recursive: true, force: true });
		}
	});

	describe("scanModsBatch", () => {
		test("Scans directory containing unpacked mod folder and test fixtures", async () => {
			const testModsDir = join(__dirname, "mocks/Celeste/Mods");
			if (!existsSync(testModsDir)) {
				return;
			}

			const result = await zip.scanModsBatch(testModsDir, { threads: 4 });
			expect(result.success).toBe(true);
			expect(result.modCount).toBeGreaterThanOrEqual(4);
			expect(result.mods.length).toBeGreaterThanOrEqual(4);

			const mauve = result.mods.find((m) => m.fileName === "mauve.zip");
			expect(mauve).toBeDefined();
			expect(mauve?.isZip).toBe(true);
			expect(mauve?.yamlContent).toContain("Name:");
		});

		test("Handles empty or invalid directories gracefully", async () => {
			const emptyDir = join(TMP_DIR, "empty_mods");
			mkdirSync(emptyDir, { recursive: true });

			const result = await zip.scanModsBatch(emptyDir);
			expect(result.success).toBe(true);
			expect(result.modCount).toBe(0);
			expect(result.mods).toBeEmpty();
		});

		test("Rejects non-existent directory", async () => {
			await expect(zip.scanModsBatch(join(TMP_DIR, "non_existent_dir"))).rejects.toThrow();
		});
	});
});
