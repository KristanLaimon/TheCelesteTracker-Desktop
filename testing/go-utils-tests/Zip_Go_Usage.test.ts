// NODE.JS/BUN/DENO ONLY
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Zip_Go from "../../src-utils/Zip_Go";
import { GetDependency, TEST_TEMP_FOLDER } from "../setup";

const TMP_DIR = join(TEST_TEMP_FOLDER, "temp_zip_usage");
const FIXTURE_SRC = join(TMP_DIR, "fixture_src");
const ZIP_PATH = join(TMP_DIR, "test.zip");

function createTestZip(): void {
	rmSync(TMP_DIR, { recursive: true, force: true });
	mkdirSync(join(FIXTURE_SRC, "subdir"), { recursive: true });
	writeFileSync(join(FIXTURE_SRC, "hello.txt"), "Hello, Celeste Modder!");
	writeFileSync(join(FIXTURE_SRC, "subdir", "nested.txt"), "Nested content");
	writeFileSync(join(FIXTURE_SRC, "data.json"), JSON.stringify({ key: "value", num: 42 }));
}

describe("Zip_Go via DI", () => {
	let zip: Zip_Go;

	beforeAll(async () => {
		zip = GetDependency(Zip_Go);
		createTestZip();
		await zip.zip(FIXTURE_SRC, ZIP_PATH);
	});

	afterAll(() => {
		if (existsSync(TMP_DIR)) {
			rmSync(TMP_DIR, { recursive: true, force: true });
		}
	});

	describe("readTextFile", () => {
		test("Reads file content from zip", async () => {
			const content = await zip.readTextFile(ZIP_PATH, "hello.txt");
			expect(content).toBe("Hello, Celeste Modder!");
		});

		test("Reads nested file from subdirectory", async () => {
			const content = await zip.readTextFile(ZIP_PATH, "subdir/nested.txt");
			expect(content).toBe("Nested content");
		});

		test("Reads JSON file", async () => {
			const content = await zip.readTextFile(ZIP_PATH, "data.json");
			const parsed = JSON.parse(content);
			expect(parsed.key).toBe("value");
			expect(parsed.num).toBe(42);
		});
	});

	describe("list", () => {
		test("Lists all files in archive", async () => {
			const files = await zip.list(ZIP_PATH);
			expect(files).toContain("hello.txt");
			expect(files).toContain("subdir/nested.txt");
			expect(files).toContain("data.json");
			expect(files).toContain("subdir/");
			expect(files.length).toBe(4);
		});
	});

	describe("unzip", () => {
		test("Extracts all files to destination directory", async () => {
			const extractDir = join(TMP_DIR, `extract_${Date.now()}`);
			await zip.unzip(ZIP_PATH, extractDir);
			expect(readFileSync(join(extractDir, "hello.txt"), "utf8")).toBe("Hello, Celeste Modder!");
			expect(readFileSync(join(extractDir, "subdir", "nested.txt"), "utf8")).toBe("Nested content");
			rmSync(extractDir, { recursive: true, force: true });
		});
	});

	describe("zip (pack)", () => {
		test("Creates zip from directory and verifies via list", async () => {
			const outputZip = join(TMP_DIR, `pack_${Date.now()}.zip`);
			const packSrc = join(TMP_DIR, `pack_src_${Date.now()}`);
			mkdirSync(packSrc, { recursive: true });
			writeFileSync(join(packSrc, "packed.txt"), "Packed content");

			await zip.zip(packSrc, outputZip);
			expect(existsSync(outputZip)).toBe(true);

			const files = await zip.list(outputZip);
			expect(files).toContain("packed.txt");

			const content = await zip.readTextFile(outputZip, "packed.txt");
			expect(content).toBe("Packed content");

			rmSync(outputZip);
			rmSync(packSrc, { recursive: true, force: true });
		});
	});

	describe("scanModsBatch", () => {
		test("Scans directory containing mod zip files in parallel", async () => {
			const modsFolder = join(TMP_DIR, "mods_folder");
			const modZipPath = join(modsFolder, "TestMod.zip");
			const modSrc = join(TMP_DIR, "test_mod_src");
			mkdirSync(join(modSrc, "Maps", "TestAuthor", "TestCampaign"), { recursive: true });
			mkdirSync(join(modSrc, "Dialog"), { recursive: true });
			mkdirSync(modsFolder, { recursive: true });

			writeFileSync(join(modSrc, "everest.yaml"), "- Name: TestMod\n  Version: 1.0.0\n");
			writeFileSync(join(modSrc, "Dialog", "English.txt"), "TestAuthor_TestCampaign_level=Test Level Name\n");
			writeFileSync(join(modSrc, "Maps", "TestAuthor", "TestCampaign", "1-Level.bin"), "bincontent");
			writeFileSync(join(modSrc, "Maps", "TestAuthor", "TestCampaign", "1-Level.meta.yaml"), "Title: Test Level\n");

			await zip.zip(modSrc, modZipPath);

			const result = await zip.scanModsBatch(modsFolder, { threads: 4 });
			expect(result.success).toBe(true);
			expect(result.modCount).toBe(1);
			expect(result.mods.length).toBe(1);
			expect(result.mods[0].fileName).toBe("TestMod.zip");
			expect(result.mods[0].isZip).toBe(true);
			expect(result.mods[0].yamlContent).toContain("Name: TestMod");
			expect(result.mods[0].dialogFiles).toBeDefined();
			expect(result.mods[0].mapFiles?.length).toBe(1);

			rmSync(modSrc, { recursive: true, force: true });
			rmSync(modsFolder, { recursive: true, force: true });
		});
	});

	describe("Error handling", () => {
		test("readTextFile with non-existent zip throws", async () => {
			await expect(zip.readTextFile(join(TMP_DIR, "no_such.zip"), "file.txt")).rejects.toThrow();
		});

		test("readTextFile with non-existent file throws", async () => {
			await expect(zip.readTextFile(ZIP_PATH, "nonexistent.txt")).rejects.toThrow();
		});

		test("list with non-existent zip throws", async () => {
			await expect(zip.list(join(TMP_DIR, "no_such.zip"))).rejects.toThrow();
		});

		test("unzip with non-existent zip throws", async () => {
			await expect(zip.unzip(join(TMP_DIR, "no_such.zip"), join(TMP_DIR, "extract_fail"))).rejects.toThrow();
		});

		test("zip with non-existent source throws", async () => {
			await expect(zip.zip(join(TMP_DIR, "no_such_src"), join(TMP_DIR, "fail.zip"))).rejects.toThrow();
		});
	});
});
