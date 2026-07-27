import { XMLParser } from "fast-xml-parser";
import { serializeError } from "serialize-error";
import type Zip_Go from "../../../dependencies/exports/Zip_Go";
import type { MapCollectibleCounts } from "../../../dependencies/exports/Zip_Go";
import type { IFileSystem } from "../../core/interfaces/IFileSystem";
import { modScannerLogger } from "../../utils/Logger";
import type Storage from "../../utils/Storage";
import type Celeste from "../Celeste";
import type { CelesteSaveSlot } from "../Celeste";
import type Everest from "../Everest";
import type { DiscoveredLobby, EverestModInfo } from "../Everest";
import { GetLevelSetNamesForMod } from "../Everest";
import type {
	ChapterStatsSummary,
	GetModStatsOptions,
	LobbyModStatisticsResult,
	LobbyStatsSummary,
	ModBasicStats,
	ModStatisticsResult,
	StandaloneModStatisticsResult,
	VanillaModBasicStats,
	VanillaModStatisticsResult,
} from "./LocalMods.types";
import { createEmptyModBasicStats, createEmptyVanillaModBasicStats } from "./LocalMods.types";
import type { LocalModsScanner } from "./LocalModsScanner";

const saveFileXmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
	isArray: (tagName) => tagName === "LevelSetStats" || tagName === "AreaStats" || tagName === "AreaModeStats" || tagName === "EntityID" || tagName === "string",
});

const STORAGE_KEY_COLLECTIBLE_TOTALS_PREFIX = "localmods_collectibletotals:";

/** Per-SID collectible maximums for one mod, plus the mod size the counts were computed from. */
type CachedModCollectibleTotals = {
	sizeBytes: number | null;
	maps: Record<string, MapCollectibleCounts>;
};

export class LocalModsStatsCalculator {
	constructor(
		private scanner: LocalModsScanner,
		private celeste: Celeste,
		private everest: Everest,
		private fs: IFileSystem,
		private zip: Zip_Go,
		private storage: Storage,
	) {}

	/**
	 * Collectible maximums per SID, parsed out of the mod's map `.bin` files.
	 *
	 * Save files only ever record what was *collected*, so totals have to come from the maps themselves.
	 * Results are cached per mod and recomputed when the mod's zip size changes.
	 * Returns an empty map on any failure — totals then stay `0` and the UI falls back to showing `?`.
	 */
	async #GetCollectibleTotals(modInfo: EverestModInfo | null): Promise<Record<string, MapCollectibleCounts>> {
		if (!modInfo?.modPath) return {};

		const storageKey = `${STORAGE_KEY_COLLECTIBLE_TOTALS_PREFIX}${modInfo.metadata?.name ?? modInfo.fileName}`;
		const sizeBytes = modInfo.sizeBytes ?? null;

		try {
			const cached = await this.storage.get<CachedModCollectibleTotals>(storageKey);
			if (cached && cached.sizeBytes === sizeBytes) return cached.maps;

			const result = await this.zip.countCollectibles(modInfo.modPath);
			const maps = result.maps ?? {};
			await this.storage.set<CachedModCollectibleTotals>(storageKey, { sizeBytes, maps });
			return maps;
		} catch (e: unknown) {
			modScannerLogger.error(`LocalModsStatsCalculator: Failed to count collectibles in maps of '${modInfo.modPath}'`, serializeError(e));
			return {};
		}
	}

	/**
	 * Retrieve all global and campaign/lobby/chapter gameplay statistics for a mod.
	 *
	 * Obeying the Options Object Pattern, `opts.saveSlot` specifies the exact 0-indexed save slot.
	 */
	public async GetStatisticsByModId(modId: string, opts: GetModStatsOptions): Promise<ModStatisticsResult> {
		const isVanilla = modId === "Celeste" || modId.toLowerCase() === "celeste";

		const allSlots = await this.celeste.GetAllSaveSlots();
		const slot = allSlots.find((s) => s.slotNumber === opts.saveSlot);

		if (!slot) {
			const emptyGlobal = createEmptyModBasicStats();
			const emptyVanillaGlobal = createEmptyVanillaModBasicStats();

			if (isVanilla) {
				return {
					modId: "Celeste",
					humanName: "Celeste",
					isVanilla: true,
					isLobbyMod: false,
					saveSlot: opts.saveSlot,
					saveWideDashes: 0,
					saveWideJumps: 0,
					global: emptyVanillaGlobal,
					campaigns: { Celeste: emptyVanillaGlobal },
					chapters: {},
				};
			}

			const modInfo = await this.scanner.EverestMods_Get_ModByModId(modId, opts);
			const humanName = modInfo?.humanName || modId;
			const isLobby = modInfo?.metadata?.isMapMod === true && modInfo?.metadata?.isLobby === true;

			if (isLobby) {
				return {
					modId,
					humanName,
					isVanilla: false,
					isLobbyMod: true,
					collabId: typeof modInfo?.metadata?.collabId === "string" && modInfo.metadata.collabId ? modInfo.metadata.collabId : modId,
					saveSlot: opts.saveSlot,
					saveWideDashes: 0,
					saveWideJumps: 0,
					global: emptyGlobal,
					lobbies: {},
					gyms: {},
					chapters: {},
				};
			}

			return {
				modId,
				humanName,
				isVanilla: false,
				isLobbyMod: false,
				saveSlot: opts.saveSlot,
				saveWideDashes: 0,
				saveWideJumps: 0,
				global: emptyGlobal,
				campaigns: {},
				chapters: {},
			};
		}

		if (isVanilla) {
			return await this.#GetVanillaStatistics(slot);
		}

		const modInfo = await this.scanner.EverestMods_Get_ModByModId(modId, opts);
		const humanName = modInfo?.humanName || modId;
		const isLobbyMod = modInfo?.metadata?.isMapMod === true && modInfo?.metadata?.isLobby === true;

		if (isLobbyMod && modInfo?.metadata?.isMapMod && modInfo?.metadata?.isLobby) {
			return await this.#GetLobbyModStatistics(modId, humanName, modInfo, slot);
		}

		return await this.#GetStandaloneModStatistics(modId, humanName, modInfo, slot);
	}

	/**
	 * Write map-derived maximums into `global.*.total` and each played side's `berriesAvailable`.
	 *
	 * Global totals sum every map of the mod, including chapters never played — those still count as
	 * available. Per-side numbers are only filled where a map SID matches a played chapter exactly, so
	 * B/C-side `.bin` files (separate SIDs the save file folds into one chapter) contribute to the
	 * global totals but not to any single side.
	 */
	#ApplyCollectibleTotals(global: ModBasicStats, chaptersMap: Record<string, ChapterStatsSummary>, totals: Record<string, MapCollectibleCounts>): void {
		for (const counts of Object.values(totals)) {
			global.redStrawberries.total += counts.red;
			global.hearts.total += counts.hearts;
			global.miniHearts.total += counts.miniHearts;
			global.specialStrawberries.golden.total += counts.golden;
			global.specialStrawberries.wingedGolden.total += counts.wingedGolden;
			global.specialStrawberries.moon.total += counts.moon;
			global.specialStrawberries.silver.total += counts.silver;
			global.specialStrawberries.rainbow.total += counts.rainbow;
			global.specialStrawberries.platinum.total += counts.platinum;
		}

		for (const [sid, summary] of Object.entries(chaptersMap)) {
			const counts = totals[sid];
			if (!counts || !summary.sides.A) continue;
			summary.sides.A.berriesAvailable = counts.red;
		}
	}

	async #GetVanillaStatistics(slot: CelesteSaveSlot): Promise<VanillaModStatisticsResult> {
		const MAX_RED_BERRIES_BY_SID: Record<string, { maxRed: number; sides: ("A" | "B" | "C")[] }> = {
			"Celeste/0-Intro": { maxRed: 0, sides: ["A"] },
			"Celeste/1-ForsakenCity": { maxRed: 20, sides: ["A", "B", "C"] },
			"Celeste/2-OldSite": { maxRed: 18, sides: ["A", "B", "C"] },
			"Celeste/3-CelestialResort": { maxRed: 25, sides: ["A", "B", "C"] },
			"Celeste/4-GoldenRidge": { maxRed: 29, sides: ["A", "B", "C"] },
			"Celeste/5-MirrorTemple": { maxRed: 31, sides: ["A", "B", "C"] },
			"Celeste/6-Reflection": { maxRed: 0, sides: ["A", "B", "C"] },
			"Celeste/7-Summit": { maxRed: 47, sides: ["A", "B", "C"] },
			"Celeste/8-Epilogue": { maxRed: 0, sides: ["A"] },
			"Celeste/9-Core": { maxRed: 5, sides: ["A", "B", "C"] },
			"Celeste/LostLevels": { maxRed: 0, sides: ["A"] },
		};

		const VANILLA_CHAPTER_NAMES: Record<string, string> = {
			"Celeste/0-Intro": "Prologue",
			"Celeste/1-ForsakenCity": "Forsaken City",
			"Celeste/2-OldSite": "Old Site",
			"Celeste/3-CelestialResort": "Celestial Resort",
			"Celeste/4-GoldenRidge": "Golden Ridge",
			"Celeste/5-MirrorTemple": "Mirror Temple",
			"Celeste/6-Reflection": "Reflection",
			"Celeste/7-Summit": "The Summit",
			"Celeste/8-Epilogue": "Epilogue",
			"Celeste/9-Core": "Core",
			"Celeste/LostLevels": "Farewell",
		};

		const global: VanillaModBasicStats = createEmptyVanillaModBasicStats();
		const chaptersMap: Record<string, ChapterStatsSummary> = {};

		let saveWideDashes = 0;
		let saveWideJumps = 0;

		try {
			const content = await this.fs.readFile(slot.fileAbsolutePath);
			const parsed = saveFileXmlParser.parse(content)?.SaveData;
			if (parsed) {
				saveWideDashes = Number(parsed.TotalDashes ?? 0);
				saveWideJumps = Number(parsed.TotalJumps ?? 0);

				const areasList = Array.isArray(parsed.Areas?.AreaStats) ? parsed.Areas.AreaStats : [];
				for (const area of areasList) {
					const sid = String(area?.["@_SID"] ?? "");
					const config = MAX_RED_BERRIES_BY_SID[sid];
					if (!sid || !config) continue;

					if (!chaptersMap[sid]) {
						chaptersMap[sid] = {
							sid,
							name: VANILLA_CHAPTER_NAMES[sid] ?? null,
							iconPath: null,
							sides: {},
						};
					}

					const modes = Array.isArray(area.Modes?.AreaModeStats) ? area.Modes.AreaModeStats : [];
					const sideNames = ["A", "B", "C"] as const;

					for (let idx = 0; idx < modes.length; idx++) {
						const mode = modes[idx];
						if (!mode) continue;
						const sideName = sideNames[idx];
						if (!sideName || !config.sides.includes(sideName)) continue;

						const completed = mode["@_Completed"] === "true" || mode["@_Completed"] === true;
						const singleRunCompleted = mode["@_SingleRunCompleted"] === "true" || mode["@_SingleRunCompleted"] === true;
						const fullClear = mode["@_FullClear"] === "true" || mode["@_FullClear"] === true;
						const deaths = Number(mode["@_Deaths"] ?? 0);
						const playTimeMs = Math.round(Number(mode["@_TimePlayed"] ?? 0) / 10000);
						const bestTimeMs = Math.round(Number(mode["@_BestTime"] ?? 0) / 10000);
						const bestFullClearTimeMs = Math.round(Number(mode["@_BestFullClearTime"] ?? 0) / 10000);
						const bestDashes = Number(mode["@_BestDashes"] ?? 0);
						const bestDeaths = Number(mode["@_BestDeaths"] ?? 0);
						const heartCollected = mode["@_HeartGem"] === "true" || mode["@_HeartGem"] === true;

						const strawberriesList = Array.isArray(mode.Strawberries?.EntityID) ? mode.Strawberries.EntityID : [];
						const rawBerryCount = strawberriesList.length;

						const hasActivity = completed || deaths > 0 || playTimeMs > 0 || heartCollected || rawBerryCount > 0 || bestTimeMs > 0 || bestDashes > 0;
						if (!hasActivity) continue;

						global.deaths += deaths;
						global.playTimeMs += playTimeMs;

						let goldenStrawberry = false;
						let wingedStrawberry = false;
						let moonBerry = false;

						if (sideName === "B" || sideName === "C") {
							goldenStrawberry = rawBerryCount > 0;
						} else if (sid === "Celeste/LostLevels") {
							// Farewell: j-19:9 is moon berry; first-room prefixed key (or single berry) golden
							for (const entity of strawberriesList) {
								const key = String(entity?.["@_Key"] ?? "");
								if (key === "j-19:9") {
									moonBerry = true;
								}
							}
							goldenStrawberry = rawBerryCount > (moonBerry ? 1 : 0);
						} else if (sideName === "A") {
							for (const entity of strawberriesList) {
								const key = String(entity?.["@_Key"] ?? "");
								if (sid === "Celeste/1-ForsakenCity" && key === "end:4") {
									wingedStrawberry = true;
								}
							}
							goldenStrawberry = rawBerryCount > config.maxRed + (wingedStrawberry ? 1 : 0);
						}

						const redBerryCount = sideName === "A" ? Math.min(rawBerryCount - (wingedStrawberry ? 1 : 0) - (goldenStrawberry ? 1 : 0), config.maxRed) : 0;

						if (redBerryCount > 0) global.redStrawberries.current += redBerryCount;
						if (goldenStrawberry) global.specialStrawberries.golden.current += 1;
						if (wingedStrawberry) global.specialStrawberries.wingedGolden.current = 1;
						if (moonBerry) global.specialStrawberries.moon.current = 1;

						if (heartCollected) global.hearts.current += 1;

						chaptersMap[sid].sides[sideName] = {
							side: sideName,
							completed,
							singleRunCompleted,
							fullClear,
							deaths,
							playTimeMs,
							bestTimeMs,
							bestFullClearTimeMs,
							bestDashes,
							bestDeaths,
							heartCollected,
							berriesCollected: Math.max(0, redBerryCount),
							berriesAvailable: sideName === "A" ? config.maxRed : 0,
							goldenStrawberry,
							wingedStrawberry,
							moonBerry,
						};
					}
				}
			}
		} catch (e: unknown) {
			modScannerLogger.error(`LocalModsStatsCalculator: Failed to parse vanilla save stats for slot ${slot.slotNumber}`, serializeError(e));
		}

		let minDeathsSum = 0;
		for (const summary of Object.values(chaptersMap)) {
			for (const side of Object.values(summary.sides)) {
				if (side.completed && side.bestDeaths >= 0) {
					minDeathsSum += side.bestDeaths;
				}
			}
		}
		global.minimumDeaths = minDeathsSum;

		return {
			modId: "Celeste",
			humanName: "Celeste",
			isVanilla: true,
			isLobbyMod: false,
			saveSlot: slot.slotNumber,
			saveWideDashes,
			saveWideJumps,
			global,
			campaigns: { Celeste: global },
			chapters: chaptersMap,
		};
	}

	async #GetLobbyModStatistics(modId: string, humanName: string, modInfo: EverestModInfo, slot: CelesteSaveSlot): Promise<LobbyModStatisticsResult> {
		const meta = modInfo.metadata;
		const collabId = meta.isLobby ? meta.collabId || modId : modId;
		const levelSetNames = GetLevelSetNamesForMod(modInfo);

		const global = createEmptyModBasicStats();
		const lobbiesMap: Record<string, LobbyStatsSummary> = {};
		const gymsMap: Record<string, ModBasicStats> = {};
		const chaptersMap: Record<string, ChapterStatsSummary> = {};

		const lobbiesList: DiscoveredLobby[] = meta.isLobby && meta.lobbies ? meta.lobbies : [];
		for (const lobby of lobbiesList) {
			const lobbyId = lobby.lobbyId;
			lobbiesMap[lobbyId] = {
				lobbyId,
				name: lobbyId,
				stats: createEmptyModBasicStats(),
				chapters: [],
			};
		}

		let saveWideDashes = 0;
		let saveWideJumps = 0;

		try {
			const content = await this.fs.readFile(slot.fileAbsolutePath);
			const parsed = saveFileXmlParser.parse(content)?.SaveData;
			if (parsed) {
				saveWideDashes = Number(parsed.TotalDashes ?? 0);
				saveWideJumps = Number(parsed.TotalJumps ?? 0);

				type CollabModSave = {
					SpeedBerryPBs?: Record<string, number>;
					OpenedMiniHeartDoors?: string[];
					CombinedRainbowBerries?: string[];
				};
				const modSave = await this.everest.ReadModSaveData<CollabModSave>(slot.slotNumber, "CollabUtils2");

				if (modSave?.CombinedRainbowBerries) {
					const matchingRainbows = modSave.CombinedRainbowBerries.filter((l) => levelSetNames.some((name) => l.startsWith(name)));
					global.specialStrawberries.rainbow.current = matchingRainbows.length;
				}

				if (modSave?.SpeedBerryPBs) {
					for (const [sid, pbTicks] of Object.entries(modSave.SpeedBerryPBs)) {
						if (levelSetNames.some((name) => sid.startsWith(name))) {
							global.specialStrawberries.speedTimers.total += 1;
							const pbSec = pbTicks / 10000000;
							if (pbSec <= 60) global.specialStrawberries.speedTimers.gold += 1;
							else if (pbSec <= 120) global.specialStrawberries.speedTimers.silver += 1;
							else global.specialStrawberries.speedTimers.bronze += 1;
						}
					}
				}

				const levelSetBlocks = [
					...(Array.isArray(parsed.LevelSets?.LevelSetStats) ? parsed.LevelSets.LevelSetStats : []),
					...(Array.isArray(parsed.LevelSetRecycleBin?.LevelSetStats) ? parsed.LevelSetRecycleBin.LevelSetStats : []),
				];

				for (const block of levelSetBlocks) {
					const blockName = String(block?.["@_Name"] ?? "");
					if (!levelSetNames.includes(blockName)) continue;

					const areasList = Array.isArray(block.Areas?.AreaStats) ? block.Areas.AreaStats : [];
					for (const area of areasList) {
						const sid = String(area?.["@_SID"] ?? "");
						if (!sid) continue;

						if (!chaptersMap[sid]) {
							chaptersMap[sid] = { sid, name: null, iconPath: null, sides: {} };
						}

						const modes = Array.isArray(area.Modes?.AreaModeStats) ? area.Modes.AreaModeStats : [];
						for (let idx = 0; idx < modes.length; idx++) {
							const mode = modes[idx];
							if (!mode) continue;
							const sideName = idx === 0 ? "A" : idx === 1 ? "B" : "C";

							const completed = mode["@_Completed"] === "true" || mode["@_Completed"] === true;
							const deaths = Number(mode["@_Deaths"] ?? 0);
							const playTimeMs = Math.round(Number(mode["@_TimePlayed"] ?? 0) / 10000);
							const bestDeaths = Number(mode["@_BestDeaths"] ?? 0);
							const bestDashes = Number(mode["@_BestDashes"] ?? 0);
							const heartCollected = mode["@_HeartGem"] === "true" || mode["@_HeartGem"] === true;
							const strawberriesList = Array.isArray(mode.Strawberries?.EntityID) ? mode.Strawberries.EntityID : [];

							const hasActivity = completed || deaths > 0 || playTimeMs > 0 || heartCollected || strawberriesList.length > 0;
							if (!hasActivity) continue;

							global.deaths += deaths;
							global.playTimeMs += playTimeMs;
							if (heartCollected) global.miniHearts.current += 1;
							global.redStrawberries.current += strawberriesList.length;

							chaptersMap[sid].sides[sideName] = {
								side: sideName,
								completed,
								singleRunCompleted: mode["@_SingleRunCompleted"] === "true" || mode["@_SingleRunCompleted"] === true,
								fullClear: mode["@_FullClear"] === "true" || mode["@_FullClear"] === true,
								deaths,
								playTimeMs,
								bestTimeMs: Math.round(Number(mode["@_BestTime"] ?? 0) / 10000),
								bestFullClearTimeMs: Math.round(Number(mode["@_BestFullClearTime"] ?? 0) / 10000),
								bestDashes,
								bestDeaths,
								heartCollected,
								berriesCollected: strawberriesList.length,
								berriesAvailable: 0,
							};
						}
					}
				}
			}
		} catch (e: unknown) {
			modScannerLogger.error(`LocalModsStatsCalculator: Failed to parse lobby mod save stats for slot ${slot.slotNumber}`, serializeError(e));
		}

		let minDeathsSum = 0;
		for (const summary of Object.values(chaptersMap)) {
			for (const side of Object.values(summary.sides)) {
				if (side.completed && side.bestDeaths >= 0) {
					minDeathsSum += side.bestDeaths;
				}
			}
		}
		global.minimumDeaths = minDeathsSum;
		this.#ApplyCollectibleTotals(global, chaptersMap, await this.#GetCollectibleTotals(modInfo));

		return {
			modId,
			humanName,
			isVanilla: false,
			isLobbyMod: true,
			collabId,
			saveSlot: slot.slotNumber,
			saveWideDashes,
			saveWideJumps,
			global,
			lobbies: lobbiesMap,
			gyms: gymsMap,
			chapters: chaptersMap,
		};
	}

	async #GetStandaloneModStatistics(
		modId: string,
		humanName: string,
		modInfo: EverestModInfo | null,
		slot: CelesteSaveSlot,
	): Promise<StandaloneModStatisticsResult> {
		const levelSetNames = modInfo ? GetLevelSetNamesForMod(modInfo) : [modId];
		const global = createEmptyModBasicStats();
		const campaignsMap: Record<string, ModBasicStats> = {};
		const chaptersMap: Record<string, ChapterStatsSummary> = {};

		let saveWideDashes = 0;
		let saveWideJumps = 0;

		try {
			const content = await this.fs.readFile(slot.fileAbsolutePath);
			const parsed = saveFileXmlParser.parse(content)?.SaveData;
			if (parsed) {
				saveWideDashes = Number(parsed.TotalDashes ?? 0);
				saveWideJumps = Number(parsed.TotalJumps ?? 0);

				const levelSetBlocks = [
					...(Array.isArray(parsed.LevelSets?.LevelSetStats) ? parsed.LevelSets.LevelSetStats : []),
					...(Array.isArray(parsed.LevelSetRecycleBin?.LevelSetStats) ? parsed.LevelSetRecycleBin.LevelSetStats : []),
				];

				for (const block of levelSetBlocks) {
					const blockName = String(block?.["@_Name"] ?? "");
					if (!levelSetNames.includes(blockName)) continue;

					if (!campaignsMap[blockName]) {
						campaignsMap[blockName] = createEmptyModBasicStats();
					}
					const campaignStats = campaignsMap[blockName];

					const areasList = Array.isArray(block.Areas?.AreaStats) ? block.Areas.AreaStats : [];
					for (const area of areasList) {
						const sid = String(area?.["@_SID"] ?? "");
						if (!sid) continue;

						if (!chaptersMap[sid]) {
							chaptersMap[sid] = { sid, name: null, iconPath: null, sides: {} };
						}

						const modes = Array.isArray(area.Modes?.AreaModeStats) ? area.Modes.AreaModeStats : [];
						for (let idx = 0; idx < modes.length; idx++) {
							const mode = modes[idx];
							if (!mode) continue;
							const sideName = idx === 0 ? "A" : idx === 1 ? "B" : "C";

							const completed = mode["@_Completed"] === "true" || mode["@_Completed"] === true;
							const deaths = Number(mode["@_Deaths"] ?? 0);
							const playTimeMs = Math.round(Number(mode["@_TimePlayed"] ?? 0) / 10000);
							const bestDeaths = Number(mode["@_BestDeaths"] ?? 0);
							const bestDashes = Number(mode["@_BestDashes"] ?? 0);
							const heartCollected = mode["@_HeartGem"] === "true" || mode["@_HeartGem"] === true;
							const strawberriesList = Array.isArray(mode.Strawberries?.EntityID) ? mode.Strawberries.EntityID : [];

							const hasActivity = completed || deaths > 0 || playTimeMs > 0 || heartCollected || strawberriesList.length > 0;
							if (!hasActivity) continue;

							global.deaths += deaths;
							global.playTimeMs += playTimeMs;
							campaignStats.deaths += deaths;
							campaignStats.playTimeMs += playTimeMs;

							if (heartCollected) {
								global.hearts.current += 1;
								campaignStats.hearts.current += 1;
							}
							global.redStrawberries.current += strawberriesList.length;
							campaignStats.redStrawberries.current += strawberriesList.length;

							chaptersMap[sid].sides[sideName] = {
								side: sideName,
								completed,
								singleRunCompleted: mode["@_SingleRunCompleted"] === "true" || mode["@_SingleRunCompleted"] === true,
								fullClear: mode["@_FullClear"] === "true" || mode["@_FullClear"] === true,
								deaths,
								playTimeMs,
								bestTimeMs: Math.round(Number(mode["@_BestTime"] ?? 0) / 10000),
								bestFullClearTimeMs: Math.round(Number(mode["@_BestFullClearTime"] ?? 0) / 10000),
								bestDashes,
								bestDeaths,
								heartCollected,
								berriesCollected: strawberriesList.length,
								berriesAvailable: 0,
							};
						}
					}
				}
			}
		} catch (e: unknown) {
			modScannerLogger.error(`LocalModsStatsCalculator: Failed to parse standalone mod save stats for slot ${slot.slotNumber}`, serializeError(e));
		}

		let minDeathsSum = 0;
		for (const summary of Object.values(chaptersMap)) {
			for (const side of Object.values(summary.sides)) {
				if (side.completed && side.bestDeaths >= 0) {
					minDeathsSum += side.bestDeaths;
				}
			}
		}
		global.minimumDeaths = minDeathsSum;
		this.#ApplyCollectibleTotals(global, chaptersMap, await this.#GetCollectibleTotals(modInfo));

		return {
			modId,
			humanName,
			isVanilla: false,
			isLobbyMod: false,
			saveSlot: slot.slotNumber,
			saveWideDashes,
			saveWideJumps,
			global,
			campaigns: campaignsMap,
			chapters: chaptersMap,
		};
	}
}
