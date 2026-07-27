// NODE.JS/BUN/DENO ONLY
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GetDependency, TEST_TEMP_FOLDER } from "../../testing/setup";
import Zip_Go from "../exports/Zip_Go";

const TMP_DIR = join(TEST_TEMP_FOLDER, "temp_export_map_images");
const MOD_SRC = join(TMP_DIR, "FakeMapMod");
const MOD_ZIP = join(TMP_DIR, "FakeMapMod.zip");
const OUT_DIR_ZIP = join(TMP_DIR, "out_zip");
const OUT_DIR_FOLDER = join(TMP_DIR, "out_folder");
const OUT_DIR_BIN = join(TMP_DIR, "out_bin");
const OUT_DIR_VANILLA = join(TMP_DIR, "out_vanilla");
const MOCK_CELESTE = join(__dirname, "mocks/Celeste");
const REAL_CELESTE = existsSync(join(MOCK_CELESTE, "Content", "Maps", "1-ForsakenCity.bin"))
	? MOCK_CELESTE
	: "C:/Program Files (x86)/Steam/steamapps/common/Celeste";

type FakeAttrValue = boolean | number | string | { type: "rle"; data: string };
type FakeEntity = { name: string; attrs?: Record<string, FakeAttrValue> };
type FakeRoom = {
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	solidsRle?: string;
	entities?: FakeEntity[];
};

function getPngDimensions(filePath: string): { width: number; height: number } {
	const buf = readFileSync(filePath);
	const width = buf.readUInt32BE(16);
	const height = buf.readUInt32BE(20);
	return { width, height };
}

/**
 * BinaryPacker test helper supporting int, float, string lookup, and type 7 RLE attributes.
 */
function buildMapBinWithRooms(rooms: FakeRoom[]): Buffer {
	const lookup: string[] = [];
	const lookupIndex = (value: string): number => {
		const existing = lookup.indexOf(value);
		if (existing >= 0) return existing;
		lookup.push(value);
		return lookup.length - 1;
	};

	const u16 = (value: number): Buffer => {
		const buffer = Buffer.alloc(2);
		buffer.writeUInt16LE(value);
		return buffer;
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

	const encodeAttr = (key: string, val: FakeAttrValue): Buffer => {
		const keyIdx = lookupIndex(key);
		if (typeof val === "boolean") {
			return Buffer.concat([u16(keyIdx), Buffer.from([0]), Buffer.from([val ? 1 : 0])]);
		}
		if (typeof val === "number") {
			if (Number.isInteger(val)) {
				const buf = Buffer.alloc(4);
				buf.writeInt32LE(val);
				return Buffer.concat([u16(keyIdx), Buffer.from([3]), buf]);
			}
			const buf = Buffer.alloc(4);
			buf.writeFloatLE(val);
			return Buffer.concat([u16(keyIdx), Buffer.from([4]), buf]);
		}
		if (typeof val === "string") {
			const strIdx = lookupIndex(val);
			return Buffer.concat([u16(keyIdx), Buffer.from([5]), u16(strIdx)]);
		}
		if (val && typeof val === "object" && val.type === "rle") {
			const bytes: number[] = [];
			const s: string = val.data;
			let i = 0;
			while (i < s.length) {
				const ch = s.charCodeAt(i);
				let count = 1;
				while (i + count < s.length && s.charCodeAt(i + count) === ch && count < 255) {
					count++;
				}
				bytes.push(count, ch);
				i += count;
			}
			const payload = Buffer.from(bytes);
			const lenBuf = Buffer.alloc(2);
			lenBuf.writeUInt16LE(payload.length);
			return Buffer.concat([u16(keyIdx), Buffer.from([7]), lenBuf, payload]);
		}
		throw new Error(`Unsupported attr value ${val}`);
	};

	const element = (name: string, attrs: Record<string, FakeAttrValue>, children: Buffer[]): Buffer => {
		const attrEntries = Object.entries(attrs);
		const parts = [u16(lookupIndex(name)), Buffer.from([attrEntries.length])];
		for (const [key, value] of attrEntries) {
			parts.push(encodeAttr(key, value));
		}
		parts.push(u16(children.length), ...children);
		return Buffer.concat(parts);
	};

	const roomElements = rooms.map((r) => {
		const children: Buffer[] = [];
		if (r.solidsRle) {
			children.push(element("solids", { innerText: { type: "rle", data: r.solidsRle } }, []));
		}
		if (r.entities && r.entities.length > 0) {
			const entElems = r.entities.map((e) => element(e.name, e.attrs ?? {}, []));
			children.push(element("entities", {}, entElems));
		}
		return element("level", { name: r.name, x: r.x, y: r.y, width: r.width, height: r.height }, children);
	});

	const root = element("Map", {}, [element("levels", {}, roomElements)]);
	return Buffer.concat([varintString("CELESTE MAP"), varintString("test"), u16(lookup.length), ...lookup.map(varintString), root]);
}

describe("Zip_Go.exportMap", () => {
	let zip: Zip_Go;

	beforeAll(async () => {
		zip = GetDependency(Zip_Go);
		rmSync(TMP_DIR, { recursive: true, force: true });
		mkdirSync(join(MOD_SRC, "Maps", "author", "campaign"), { recursive: true });

		// Solids grid 40 cols x 22 rows (320x180 px)
		const solidsA00 = `${"1".repeat(40)}\n${"0".repeat(40)}\n`.repeat(11);
		const solidsA01 = `${"0".repeat(40)}\n${"1".repeat(40)}\n`.repeat(11);

		const mapBin = buildMapBinWithRooms([
			{
				name: "a-00",
				x: 0,
				y: 0,
				width: 320,
				height: 180,
				solidsRle: solidsA00,
				entities: [
					{ name: "player", attrs: { x: 16, y: 160 } },
					{ name: "strawberry", attrs: { x: 160, y: 90 } },
					{ name: "spikesUp", attrs: { x: 80, y: 172 } },
				],
			},
			{
				name: "a-01",
				x: 320,
				y: 0,
				width: 320,
				height: 180,
				solidsRle: solidsA01,
				entities: [
					{ name: "strawberry", attrs: { x: 100, y: 50 } },
					{ name: "refill", attrs: { x: 200, y: 100 } },
				],
			},
		]);

		writeFileSync(join(MOD_SRC, "Maps", "author", "campaign", "chapter.bin"), mapBin);
		spawnSync("powershell", ["-Command", `Compress-Archive -Path '${join(MOD_SRC, "*")}' -DestinationPath '${MOD_ZIP}' -Force`]);
	});

	afterAll(() => {
		rmSync(TMP_DIR, { recursive: true, force: true });
	});

	test("exports room PNGs, composite map PNG, and manifest.json from zipped mod", async () => {
		const result = await zip.exportMap({ modPath: MOD_ZIP, mapSid: "author/campaign/chapter", outputDir: OUT_DIR_ZIP });

		expect(result.success).toBe(true);
		expect(result.mapSid).toBe("author/campaign/chapter");
		expect(result.fullMapPng).toBe("full_map.png");
		expect(result.rooms?.length).toBe(2);

		const manifestPath = join(OUT_DIR_ZIP, "manifest.json");
		expect(existsSync(manifestPath)).toBe(true);

		const manifestJson = JSON.parse(readFileSync(manifestPath, "utf-8"));
		expect(manifestJson.success).toBe(true);
		expect(manifestJson.rooms.length).toBe(2);
		expect(manifestJson.rooms[0].name).toBe("a-00");
		expect(manifestJson.rooms[1].name).toBe("a-01");

		const room0Path = join(OUT_DIR_ZIP, manifestJson.rooms[0].image);
		const room1Path = join(OUT_DIR_ZIP, manifestJson.rooms[1].image);
		const fullMapPath = join(OUT_DIR_ZIP, result.fullMapPng ?? "full_map.png");

		expect(existsSync(room0Path)).toBe(true);
		expect(existsSync(room1Path)).toBe(true);
		expect(existsSync(fullMapPath)).toBe(true);

		expect(getPngDimensions(room0Path)).toEqual({ width: 320, height: 180 });
		expect(getPngDimensions(room1Path)).toEqual({ width: 320, height: 180 });
		expect(getPngDimensions(fullMapPath)).toEqual({ width: 640, height: 180 });
	});

	test("exports from unpacked folder mod identical to zip", async () => {
		const result = await zip.exportMap({ modPath: MOD_SRC, mapSid: "author/campaign/chapter", outputDir: OUT_DIR_FOLDER });

		expect(result.success).toBe(true);
		expect(result.rooms?.length).toBe(2);
		expect(existsSync(join(OUT_DIR_FOLDER, "manifest.json"))).toBe(true);
		expect(existsSync(join(OUT_DIR_FOLDER, "full_map.png"))).toBe(true);
	});

	test("exports directly from single .bin file path", async () => {
		const binPath = join(MOD_SRC, "Maps", "author", "campaign", "chapter.bin");
		const result = await zip.exportMap({ modPath: binPath, mapSid: "chapter", outputDir: OUT_DIR_BIN });

		expect(result.success).toBe(true);
		expect(result.rooms?.length).toBe(2);
		expect(existsSync(join(OUT_DIR_BIN, "manifest.json"))).toBe(true);
		expect(existsSync(join(OUT_DIR_BIN, "full_map.png"))).toBe(true);
	});

	test.skipIf(!existsSync(REAL_CELESTE))("exports real vanilla Celeste map 1-ForsakenCity.bin", async () => {
		const mapPath = join(REAL_CELESTE, "Content", "Maps", "1-ForsakenCity.bin");
		const result = await zip.exportMap({ modPath: mapPath, mapSid: "1-ForsakenCity", outputDir: OUT_DIR_VANILLA });

		expect(result.success).toBe(true);
		expect(result.rooms?.length).toBeGreaterThan(0);
		expect(existsSync(join(OUT_DIR_VANILLA, "manifest.json"))).toBe(true);
		expect(existsSync(join(OUT_DIR_VANILLA, "full_map.png"))).toBe(true);

		const firstRoom = result.rooms?.[0];
		if (firstRoom) {
			const roomPngPath = join(OUT_DIR_VANILLA, firstRoom.image);
			expect(existsSync(roomPngPath)).toBe(true);
			const dims = getPngDimensions(roomPngPath);
			expect(dims.width).toBe(firstRoom.width);
			expect(dims.height).toBe(firstRoom.height);
		}
	});
});
