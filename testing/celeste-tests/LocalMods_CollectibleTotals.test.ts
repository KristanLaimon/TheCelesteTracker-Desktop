// NODE.JS/BUN/DENO ONLY
import { describe, expect, test } from "bun:test";
import type { IFileSystem } from "../../src/core/interfaces/IFileSystem";
import type Celeste from "../../src/domain/Celeste";
import type Everest from "../../src/domain/Everest";
import type { EverestModInfo } from "../../src/domain/Everest";
import type { LocalModsScanner } from "../../src/domain/localmods/LocalModsScanner";
import { LocalModsStatsCalculator } from "../../src/domain/localmods/LocalModsStatsCalculator";
import Storage from "../../src/utils/Storage";
import type Zip_Go from "../../src-utils/Zip_Go";

const SID = "author/campaign/chapter";

const SAVE_XML = `<?xml version="1.0" encoding="utf-8"?>
<SaveData>
	<TotalDashes>10</TotalDashes>
	<TotalJumps>20</TotalJumps>
	<LevelSets>
		<LevelSetStats Name="author/campaign">
			<Areas>
				<AreaStats SID="${SID}">
					<Modes>
						<AreaModeStats TotalStrawberries="2" Completed="true" Deaths="7" TimePlayed="10000000" BestDeaths="3" HeartGem="false">
							<Strawberries>
								<EntityID Key="a:1" />
								<EntityID Key="a:2" />
							</Strawberries>
						</AreaModeStats>
					</Modes>
				</AreaStats>
			</Areas>
		</LevelSetStats>
	</LevelSets>
</SaveData>`;

const MOD_INFO = {
	fileName: "FakeMod.zip",
	isZip: true,
	modPath: "/mods/FakeMod.zip",
	humanName: "Fake Mod",
	sizeBytes: 1234,
	metadata: {
		name: "FakeMod",
		isLobby: false,
		chapters: [],
		campaigns: [{ campaignNameId: "author/campaign" }],
	},
} as unknown as EverestModInfo;

function makeCalculator(mapCounts: Record<string, unknown>) {
	const scanner = { EverestMods_Get_ModByModId: async () => MOD_INFO } as unknown as LocalModsScanner;
	const celeste = { GetAllSaveSlots: async () => [{ slotNumber: 0, fileAbsolutePath: "/saves/0.celeste" }] } as unknown as Celeste;
	const everest = { ReadModSaveData: async () => null } as unknown as Everest;
	const fs = { readFile: async () => SAVE_XML } as unknown as IFileSystem;
	const zip = { countCollectibles: async () => ({ success: true, maps: mapCounts }) } as unknown as Zip_Go;

	return new LocalModsStatsCalculator(scanner, celeste, everest, fs, zip, new Storage({ adapters: [] }));
}

const emptyCounts = { red: 0, golden: 0, wingedGolden: 0, moon: 0, hearts: 0, miniHearts: 0, silver: 0, speed: 0, rainbow: 0, platinum: 0 };

describe("LocalModsStatsCalculator collectible totals", () => {
	test("fills global totals and per-chapter berriesAvailable from map counts", async () => {
		const calculator = makeCalculator({
			[SID]: { ...emptyCounts, red: 5, golden: 1, hearts: 1 },
			"author/campaign/unplayed": { ...emptyCounts, red: 3, hearts: 1 },
		});

		const result = await calculator.GetStatisticsByModId("FakeMod", { saveSlot: 0 });
		expect(result.isVanilla).toBe(false);
		if (result.isVanilla || result.isLobbyMod) throw new Error("expected a standalone mod result");

		// Unplayed chapters still count as available content.
		expect(result.global.redStrawberries.current).toBe(2);
		expect(result.global.redStrawberries.total).toBe(8);
		expect(result.global.hearts.total).toBe(2);
		expect(result.global.specialStrawberries.golden.total).toBe(1);
		expect(result.chapters[SID]?.sides.A?.berriesAvailable).toBe(5);
	});

	test("leaves totals at zero when the map scan yields nothing", async () => {
		const calculator = makeCalculator({});

		const result = await calculator.GetStatisticsByModId("FakeMod", { saveSlot: 0 });
		if (result.isVanilla || result.isLobbyMod) throw new Error("expected a standalone mod result");

		expect(result.global.redStrawberries.current).toBe(2);
		expect(result.global.redStrawberries.total).toBe(0);
		expect(result.chapters[SID]?.sides.A?.berriesAvailable).toBe(0);
	});
});
