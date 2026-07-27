// NODE.JS/BUN/DENO ONLY
import { describe, expect, test } from "bun:test";
import Zip_Go from "../../dependencies/exports/Zip_Go";
import { GetDependency } from "../../testing/setup";
import { IFileSystem_Token } from "../core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../core/interfaces/IFileSystem";
import Storage from "../utils/Storage";
import Celeste from "./Celeste";
import Everest from "./Everest";
import DBMods from "./LocalMods";
import Olympus from "./Olympus";

describe("DBMods.GetStatisticsByModId (Real Data Tests)", () => {
	test("reads real vanilla Celeste stats from testing/Celeste save files for slot 0", async () => {
		const celeste = GetDependency(Celeste);
		const everest = GetDependency(Everest);
		const olympus = GetDependency(Olympus);
		const fs = GetDependency<IFileSystem>(IFileSystem_Token);
		const storage = new Storage({ adapters: [] });

		const storages = { installed: storage, historical: storage, enrichment: storage, collectibleTotals: storage };
		const db = new DBMods(everest, storages, {} as any, {} as any, olympus, fs, celeste, GetDependency(Zip_Go));

		const result = await db.GetStatisticsByModId("Celeste", { saveSlot: 0 });

		expect(result.modId).toBe("Celeste");
		expect(result.isVanilla).toBe(true);
		expect(result.isLobbyMod).toBe(false);

		if (result.isVanilla) {
			expect(result.saveSlot).toBe(0);
			expect(result.saveWideDashes).toBeGreaterThan(0);
			expect(result.saveWideJumps).toBeGreaterThan(0);

			expect(result.global.redStrawberries.total).toBe(175);
			expect(result.global.specialStrawberries.golden.total).toBe(25);
			expect(result.global.specialStrawberries.wingedGolden.total).toBe(1);
			expect(result.global.specialStrawberries.moon.total).toBe(1);
			expect(result.global.hearts.total).toBe(24);

			// Real slot-0 save data truth
			expect(result.global.deaths).toBe(17372);
			expect(result.global.playTimeMs).toBeGreaterThan(0);
			expect(result.global.specialStrawberries.golden.current).toBe(21);
			expect(result.global.specialStrawberries.wingedGolden.current).toBe(1);
			expect(result.global.specialStrawberries.moon.current).toBe(1);
			expect(result.global.hearts.current).toBe(24);
			expect(result.global.redStrawberries.current).toBe(175);

			// Chapter assertions
			expect(Object.keys(result.chapters["Celeste/0-Intro"].sides)).toEqual(["A"]);
			expect(Object.keys(result.chapters["Celeste/8-Epilogue"].sides)).toEqual(["A"]);
			expect(Object.keys(result.chapters["Celeste/LostLevels"].sides)).toEqual(["A"]);

			expect(result.chapters["Celeste/1-ForsakenCity"]).toBeDefined();
			expect(result.chapters["Celeste/1-ForsakenCity"].name).toBe("Forsaken City");
			expect(result.chapters["Celeste/1-ForsakenCity"].sides.A.berriesCollected).toBe(20);
			expect(result.chapters["Celeste/1-ForsakenCity"].sides.A.goldenStrawberry).toBe(true);
			expect(result.chapters["Celeste/1-ForsakenCity"].sides.A.wingedStrawberry).toBe(true);

			expect(result.chapters["Celeste/2-OldSite"]).toBeDefined();
			expect(result.chapters["Celeste/2-OldSite"].name).toBe("Old Site");
			expect(result.chapters["Celeste/2-OldSite"].sides.A.bestDashes).toBeGreaterThan(0);
			expect(result.chapters["Celeste/2-OldSite"].sides.A.goldenStrawberry).toBe(true);

			expect(result.chapters["Celeste/9-Core"]).toBeDefined();
			expect(result.chapters["Celeste/9-Core"].name).toBe("Core");
			expect(result.chapters["Celeste/9-Core"].sides.A.berriesCollected).toBe(5);
			expect(result.chapters["Celeste/9-Core"].sides.A.berriesAvailable).toBe(5);
			expect(result.chapters["Celeste/9-Core"].sides.A.goldenStrawberry).toBe(false);

			expect(result.chapters["Celeste/LostLevels"]).toBeDefined();
			expect(result.chapters["Celeste/LostLevels"].name).toBe("Farewell");
			expect(result.chapters["Celeste/LostLevels"].sides.A.moonBerry).toBe(true);
		}
	});

	test("reads real SpringCollab2020 / CollabUtils2 stats from testing/Celeste save files", async () => {
		const celeste = GetDependency(Celeste);
		const everest = GetDependency(Everest);
		const olympus = GetDependency(Olympus);
		const fs = GetDependency<IFileSystem>(IFileSystem_Token);
		const storage = new Storage({ adapters: [] });

		const storages = { installed: storage, historical: storage, enrichment: storage, collectibleTotals: storage };
		const db = new DBMods(everest, storages, {} as any, {} as any, olympus, fs, celeste, GetDependency(Zip_Go));

		const result = await db.GetStatisticsByModId("SpringCollab2020", { saveSlot: 0 });

		expect(result.modId).toBe("SpringCollab2020");
		expect(result.isVanilla).toBe(false);

		if (result.isLobbyMod) {
			expect(result.collabId).toBe("SpringCollab2020");
			expect(result.global.miniHearts.total).toBeGreaterThanOrEqual(0);
			expect(result.global.specialStrawberries.speedTimers.total).toBeGreaterThanOrEqual(0);
		} else {
			expect(result.global.deaths).toBeGreaterThanOrEqual(0);
		}
	});

	test("filters real save statistics by specific saveSlot (slot 0 vs slot 1)", async () => {
		const celeste = GetDependency(Celeste);
		const everest = GetDependency(Everest);
		const olympus = GetDependency(Olympus);
		const fs = GetDependency<IFileSystem>(IFileSystem_Token);
		const storage = new Storage({ adapters: [] });

		const storages = { installed: storage, historical: storage, enrichment: storage, collectibleTotals: storage };
		const db = new DBMods(everest, storages, {} as any, {} as any, olympus, fs, celeste, GetDependency(Zip_Go));

		const slot0 = await db.GetStatisticsByModId("Celeste", { saveSlot: 0 });
		const slot1 = await db.GetStatisticsByModId("Celeste", { saveSlot: 1 });

		expect(slot0.isVanilla).toBe(true);
		expect(slot1.isVanilla).toBe(true);
		if (slot0.isVanilla && slot1.isVanilla) {
			expect(slot0.global.deaths).toBe(17372);
			expect(slot1.global.deaths).toBe(11795);
			expect(slot0.global.specialStrawberries.golden.current).toBe(21);
			expect(slot1.global.specialStrawberries.golden.current).toBe(11);
		}
	});
});
