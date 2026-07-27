// NODE.JS/BUN/DENO ONLY
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GetDependency, TEST_TEMP_FOLDER } from "../../testing/setup";
import Zip_Go from "../exports/Zip_Go";

const TMP_DIR = join(TEST_TEMP_FOLDER, "temp_count_collectibles");
const MOD_SRC = join(TMP_DIR, "FakeMod");
const MOD_ZIP = join(TMP_DIR, "FakeMod.zip");
const STEAM_CELESTE = "C:/Program Files (x86)/Steam/steamapps/common/Celeste";
const MOCK_CELESTE = join(__dirname, "mocks/Celeste");
const REAL_CELESTE = existsSync(join(STEAM_CELESTE, "Content")) ? STEAM_CELESTE : MOCK_CELESTE;

type FakeEntity = { name: string; attrs?: Record<string, boolean> };

/**
 * Minimal BinaryPacker writer, mirroring the reader in `src-utils/mapbin.go`.
 * Only the two pieces the classifier reads are emitted: element names and boolean attributes.
 */
function buildMapBin(entities: FakeEntity[], triggers: FakeEntity[]): Buffer {
	const lookup: string[] = [];
	const lookupIndex = (value: string): number => {
		const existing = lookup.indexOf(value);
		if (existing >= 0) return existing;
		lookup.push(value);
		return lookup.length - 1;
	};

	const varintString = (value: string): Buffer => {
		const raw = Buffer.from(value, "utf8");
		const lengthBytes: number[] = [];
		let remaining = raw.length;
		do {
			let byte = remaining & 0x7f;
			remaining >>= 7;
			if (remaining > 0) byte |= 0x80;
			lengthBytes.push(byte);
		} while (remaining > 0);
		return Buffer.concat([Buffer.from(lengthBytes), raw]);
	};

	const u16 = (value: number): Buffer => {
		const buffer = Buffer.alloc(2);
		buffer.writeUInt16LE(value);
		return buffer;
	};

	const element = (name: string, attrs: Record<string, boolean>, children: Buffer[]): Buffer => {
		const attrEntries = Object.entries(attrs);
		const parts = [u16(lookupIndex(name)), Buffer.from([attrEntries.length])];
		for (const [key, value] of attrEntries) {
			parts.push(u16(lookupIndex(key)), Buffer.from([0]), Buffer.from([value ? 1 : 0]));
		}
		parts.push(u16(children.length), ...children);
		return Buffer.concat(parts);
	};

	const toElements = (list: FakeEntity[]) => list.map((e) => element(e.name, e.attrs ?? {}, []));
	const room = element("level", {}, [element("entities", {}, toElements(entities)), element("triggers", {}, toElements(triggers))]);
	const root = element("Map", {}, [element("levels", {}, [room])]);

	// The lookup table must be serialized after the tree, since building the tree is what populates it.
	return Buffer.concat([varintString("CELESTE MAP"), varintString("test"), u16(lookup.length), ...lookup.map(varintString), root]);
}

describe("Zip_Go.countCollectibles", () => {
	let zip: Zip_Go;

	beforeAll(async () => {
		zip = GetDependency(Zip_Go);
		rmSync(TMP_DIR, { recursive: true, force: true });
		mkdirSync(join(MOD_SRC, "Maps", "author", "campaign"), { recursive: true });

		const map = buildMapBin(
			[
				{ name: "strawberry", attrs: { moon: false, winged: false } },
				{ name: "strawberry", attrs: { moon: false, winged: true } },
				{ name: "strawberry", attrs: { moon: true, winged: false } },
				{ name: "GameHelper/FlagCollectBerry" },
				{ name: "goldenBerry", attrs: { winged: false } },
				{ name: "goldenBerry", attrs: { winged: true } },
				{ name: "blackGem" },
				{ name: "CollabUtils2/MiniHeart" },
				{ name: "CollabUtils2/SilverBerry" },
				{ name: "BrokemiaHelper/trollStrawberry" },
				{ name: "CollabUtils2/FakeMiniHeart" },
				{ name: "MaxHelpingHand/MultiRoomStrawberrySeed" },
				{ name: "CollabUtils2/GoldenBerryPlayerRespawnPoint" },
				{ name: "vitellary/keyberry" },
			],
			[{ name: "goldenBerryCollectTrigger" }, { name: "CollabUtils2/SilverBerryCollectTrigger" }],
		);
		writeFileSync(join(MOD_SRC, "Maps", "author", "campaign", "chapter.bin"), map);
		spawnSync("powershell", ["-Command", `Compress-Archive -Path '${join(MOD_SRC, "*")}' -DestinationPath '${MOD_ZIP}' -Force`]);
	});

	afterAll(() => {
		rmSync(TMP_DIR, { recursive: true, force: true });
	});

	test("classifies collectibles and ignores decoys, controllers and triggers", async () => {
		const result = await zip.countCollectibles(MOD_ZIP);
		const counts = result.maps?.["author/campaign/chapter"];

		expect(result.success).toBe(true);
		expect(counts).toBeDefined();
		expect(counts?.red).toBe(3); // 2 plain strawberries (winged reds included) + the helper berry
		expect(counts?.moon).toBe(1);
		expect(counts?.golden).toBe(1);
		expect(counts?.wingedGolden).toBe(1);
		expect(counts?.hearts).toBe(1);
		expect(counts?.miniHearts).toBe(1);
		expect(counts?.silver).toBe(1);
	});

	test("reads unpacked folder mods the same way as zipped ones", async () => {
		const fromFolder = await zip.countCollectibles(MOD_SRC);
		const fromZip = await zip.countCollectibles(MOD_ZIP);
		expect(fromFolder.maps).toEqual(fromZip.maps);
	});

	test.skipIf(!existsSync(REAL_CELESTE))("matches the known vanilla Celeste totals", async () => {
		const result = await zip.countCollectibles(join(REAL_CELESTE, "Content"));
		const maps = Object.values(result.maps ?? {});
		expect(maps.length).toBeGreaterThan(0);

		const sum = (pick: (m: (typeof maps)[number]) => number) => maps.reduce((acc, m) => acc + pick(m), 0);
		if (existsSync(join(STEAM_CELESTE, "Content"))) {
			expect(sum((m) => m.red)).toBe(175);
			expect(sum((m) => m.golden)).toBe(25);
			expect(sum((m) => m.moon)).toBe(1);
		} else {
			expect(sum((m) => m.red)).toBeGreaterThanOrEqual(20);
		}
	});

	test.skipIf(!existsSync(join(REAL_CELESTE, "Mods/StrawberryJam2021.zip")))(
		"parses every StrawberryJam2021 map, including the ones with trailing bytes",
		async () => {
			const result = await zip.countCollectibles(join(REAL_CELESTE, "Mods/StrawberryJam2021.zip"));
			const entries = Object.entries(result.maps ?? {});
			expect(entries.length).toBe(128);
			expect(result.failed ?? {}).toEqual({});

			// Every real chapter (not a lobby, gym or heart-side) holds exactly one silver berry and at least one mini heart.
			const chapters = entries.filter(([sid]) => !/0-Lobbies|0-Gyms|ZZ-HeartSide/.test(sid));
			expect(chapters.length).toBe(111);
			expect(chapters.every(([, counts]) => counts.silver === 1 && counts.miniHearts >= 1)).toBe(true);
		},
		30_000,
	);
});
