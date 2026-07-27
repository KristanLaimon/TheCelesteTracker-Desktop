// NODE.JS/BUN/DENO ONLY
import { describe, expect, test } from "bun:test";
import type { IFileSystem } from "../core/interfaces/IFileSystem";
import Storage from "../utils/Storage";
import type Everest from "./Everest";
import type { EverestHistoricalLevelSets, EverestModInfo } from "./Everest";
import DBMods from "./LocalMods";
import type Olympus from "./Olympus";

function makeMod(name: string, campaignNameId: string, modPath: string): EverestModInfo {
	return {
		fileName: `${name}.zip`,
		isZip: true,
		modPath,
		humanName: name,
		sizeBytes: 1234,
		metadata: {
			name,
			version: "1.0.0",
			dependencies: [{ name: "Everest", version: "1.0.0" }],
			isMapMod: true,
			isLobby: false,
			chapters: [],
			campaigns: [{ campaignNameId, maps: [] }],
		},
	};
}

function buildDbMods(opts: { mods: EverestModInfo[]; historical: EverestHistoricalLevelSets; existingPaths: Set<string>; olympusInstalled: boolean }) {
	const fakeEverest = {
		GetModsInstalledFull: async () => opts.mods,
		GetAllHistoricalLevelSetNames: async () => opts.historical,
	} as unknown as Everest;

	const fakeOlympus = {
		isInstalled: async () => opts.olympusInstalled,
		GetModCategoryByModId: async () => "Maps",
	} as unknown as Olympus;

	const fakeFs = {
		exists: async (path: string) => opts.existingPaths.has(path),
	} as unknown as IFileSystem;

	const storage = new Storage({ adapters: [] });
	const storages = { installed: storage, historical: storage, enrichment: storage, collectibleTotals: storage };
	// biome-ignore lint/suspicious/noExplicitAny: test-only stubs for unused constructor deps
	return new DBMods(fakeEverest, storages, {} as any, {} as any, fakeOlympus, fakeFs, {} as any, {} as any);
}

describe("DBMods.Mods_GetAllHistorical", () => {
	test("joins installed, gone-but-cached, and tier-2 fallback rows without duplicates", async () => {
		const installedMod = makeMod("InstalledMod", "author1/installed", "/mods/installed.zip");
		const goneMod = makeMod("GoneMod", "author2/gone", "/mods/gone.zip");

		const db = buildDbMods({
			mods: [installedMod, goneMod],
			historical: {
				installedLevelSetNames: [],
				// "author2/gone" already known via GoneMod's campaigns -> must be deduped, not a third row
				recycledLevelSetNames: ["author2/gone", "UnknownAuthor/UnknownCampaign"],
			},
			existingPaths: new Set(["/mods/installed.zip"]),
			olympusInstalled: true,
		});

		const rows = await db.Mods_GetAllHistorical();

		expect(rows).toHaveLength(3);

		const installedRow = rows.find((r) => r.modNameId === "InstalledMod");
		expect(installedRow?.installed).toBe(true);
		expect(installedRow?.dependenciesCount).toBe(1);
		expect(installedRow?.sizeBytes).toBe(1234);

		const goneRow = rows.find((r) => r.modNameId === "GoneMod");
		expect(goneRow?.installed).toBe(false);
		expect(goneRow?.dependenciesCount).toBe(1); // still known — real cached data, not a fallback row

		const fallbackRow = rows.find((r) => r.modNameId === null);
		expect(fallbackRow).toBeDefined();
		expect(fallbackRow?.humanName).toBe("UnknownAuthor");
		expect(fallbackRow?.installed).toBe(false);
		expect(fallbackRow?.sizeBytes).toBeNull();
		expect(fallbackRow?.dependenciesCount).toBeNull();
	});

	test("category resolution falls back gracefully when Olympus is not installed and Maddies has no match", async () => {
		const mod = makeMod("SoloMod", "author/solo", "/mods/solo.zip");
		const db = buildDbMods({
			mods: [mod],
			historical: { installedLevelSetNames: [], recycledLevelSetNames: [] },
			existingPaths: new Set(["/mods/solo.zip"]),
			olympusInstalled: false,
		});

		const category = await db.ResolveModCategory("SoloMod");
		expect(category).toBeNull();
	});
});
