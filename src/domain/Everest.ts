// UNIVERSAL COMPATIBILITY
/**
 * @fileoverview Core Everest mod scanning types and orchestration.
 *
 * File structure inside a Celeste mod (folder or .zip):
 *   ├── everest.yaml              — Mod metadata (name, version, deps)
 *   ├── Meta.yaml / meta.yaml     — Per-map metadata
 *   ├── Dialog/English.txt        — Dialog lines (key=value)
 *   ├── Maps/                     — All .bin map files
 *   │   ├── <Author>/<Campaign>/  — Non-collab: one folder level per campaign
 *   │   └── <CollabName>/         — Collab: structured with subdirs
 *   │       ├── 0-Lobbies/        — .bin files for lobby stamps
 *   │       ├── 0-Gyms/           — .bin files for gym rooms
 *   │       └── <LobbyId>/        — Level .bins belonging to that lobby
 *   ├── CollabUtils2CollabID.txt  — Collab ID (if collab mod)
 *   ├── CollabUtils2LazyLoading.yaml — Lobby lazy-loading config
 *   └── *.altsideshelper.meta.yaml — Alt Sides Helper per-map config
 */

import { XMLParser } from "fast-xml-parser";
import * as yaml from "js-yaml";
import { serializeError } from "serialize-error";
import { inject, injectable } from "tsyringe";
import Zip_Go from "../../src-utils/Zip_Go";
import { IFileSystem_Token, IThreadConstructor_Token } from "../core/interfaces/DependencyInjectionTokens";
import type { DirectoryEntry, IFileSystem } from "../core/interfaces/IFileSystem";
import type { IThreadConstructor } from "../core/interfaces/IThread";
import { Log_Error } from "../utils/Logger";
import Celeste from "./Celeste";
import { ALT_SIDES_META_EXT, type AltSidesHelperMeta } from "./Everest.altsideshelper";
import { type CollabUtils2LazyLoadingYaml, CollabUtils2Scanner } from "./Everest.collabutils2";
import { DialogReader, sidToDialogKey } from "./Everest.dialog";

/** Parses `<LevelSets>`/`<LevelSetRecycleBin>` blocks from `.celeste` save XML — `LevelSetStats` is forced to always be an array, even when a save has exactly one entry. */
const saveFileXmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
	isArray: (tagName) => tagName === "LevelSetStats",
});

/** A dependency declared in the mod's `everest.yaml` (`Dependencies` / `dependencies` array). */
export type ModDependency = { name: string; version: string };

/**
 * Reference to a single map chapter by its SID.
 * A chapter is one playable .bin file.
 * @example { chapterId: "bryse0n/berry143/berry143" }
 */
export type ModChapter = { chapterId: string };

/**
 * A lobby inside a collab, holding references to its levels.
 * Corresponds to a folder like `Maps/<Collab>/<LobbyId>/` in collab structure.
 * `gymId` is optionally set if the lobby has a gym in `Maps/<Collab>/0-Gyms/`.
 */
export type LobbyChapter = {
	gymId?: string;
	lobbyId: string;
	lobbyLevels: ModChapter[];
};

/**
 * Fully scanned metadata for a mod.
 *
 * Discriminated by `isLobby`:
 * - `true`  → collab mod with lobbies/gyms/prologue
 * - `false` → standalone mod with flat campaign folders
 *
 * Raw YAML fields from `everest.yaml` (e.g. `Name`, `Dependencies`) are
 * destructured out during parsing; only the normalized lowercase forms survive.
 * Extra YAML keys (e.g. mod-specific config) pass through via `[key: string]: unknown`.
 */
export type ModMetadata =
	| {
			/** MOD UNIQUE IDENTIFIER HERE: Mod display name — from `everest.yaml` `Name`/`name` field. */
			name: string;
			/** Version string — from `everest.yaml` `Version`/`version`. */
			version: string;
			/** Path to the .dll runtime file — from `everest.yaml` `DLL`/`dll`. */
			dll?: string;
			/** Required dependency list — from `everest.yaml` `Dependencies` / `dependencies`. */
			dependencies: ModDependency[];
			/** Optional dependencies — from `everest.yaml` `OptionalDependencies`. */
			optionalDependencies?: ModDependency[];
			/** `true` for collab mods (has `CollabUtils2CollabID.txt`). */
			isLobby: true;
			/** Derived lobby chapter list (same maps as `lobbies` but flattened to ids). */
			lobbyChapters: LobbyChapter[];
			/** Collab identifier — contents of `CollabUtils2CollabID.txt`. */
			collabId: string;
			/** Lazy-loading config — contents of `CollabUtils2LazyLoading.yaml`. */
			lazyLoadingCfg?: CollabUtils2LazyLoadingYaml;
			/** Full lobby scan data from `Maps/<Collab>/0-Lobbies/`. */
			lobbies: DiscoveredLobby[];
			/** Gym maps from `Maps/<Collab>/0-Gyms/`. */
			gyms: DiscoveredMap[];
			/** Optional prologue map (lobby bin named `0-Prologue*`). */
			prologue?: DiscoveredMap;
			[key: string]: unknown;
	  }
	| {
			name: string;
			version: string;
			dll?: string;
			dependencies: ModDependency[];
			optionalDependencies?: ModDependency[];
			/** `false` for standalone (non-collab) mods. */
			isLobby: false;
			/** Derived chapter list (flattened from `campaigns`). */
			chapters: ModChapter[];
			/** Campaign data from `Maps/<Author>/<Campaign>/` folders. */
			campaigns: DiscoveredCampaign[];
			[key: string]: unknown;
	  };

/**
 * A mod discovered on disk (folder or .zip inside the Celeste `Mods/` directory).
 *
 * - `fileName` — the folder or .zip name (e.g. `"Berry 143.zip"`)
 * - `name` — human-readable name derived from `fileName` by `NormalizeCelesteModName`, to get the modid use metadata.name (the real mod ID inside everest!)
 * - `modPath` — full filesystem path to the mod
 * - `isZip` — whether the mod is a .zip archive or a loose folder
 * - `metadata` — full scan result including YAML parse + campaign/lobby structure
 */
export type EverestModInfo = {
	fileName: string;
	isZip: boolean;
	modPath: string;
	metadata: ModMetadata;
	humanName: string;
	/** Zip file size in bytes, captured during `GetModsInstalledFull`. `null` for folder mods (no reliable recursive size) or on stat failure. `undefined` if never scanned via the full path. */
	sizeBytes?: number | null;
};

/** Per-mod-slot save-file LevelSet identifiers found across all save slots. */
export type EverestHistoricalLevelSets = {
	/** `<LevelSets><LevelSetStats Name="...">` — informational only, already covered accurately by the Mods/ folder scan. */
	installedLevelSetNames: string[];
	/** `<LevelSetRecycleBin><LevelSetStats Name="...">` — campaigns played before, since uninstalled. */
	recycledLevelSetNames: string[];
};

/**
 * A mod's save-file `LevelSetStats Name`(s) — its "second unique id", alongside `metadata.name`.
 * Derived from data `GetModsInstalledFull` already scans, no extra scan needed:
 * - Standalone mods: `campaigns[].campaignNameId` (already in the same `"<author>/<campaign>"` shape saves use).
 * - Collab mods: `${collabId}/${lobbies[].lobbyId}` — `lobbyId` alone is just the last SID segment, the save file's
 *   `LevelSetStats Name` needs the collab id prefix put back (e.g. `"BreezeContest2024/0-Lobbies"`).
 */
export function GetLevelSetNamesForMod(mod: EverestModInfo): string[] {
	const meta = mod.metadata;
	if (!meta) return [];
	if (meta.isLobby) {
		return (meta.lobbies ?? []).map((l) => (meta.collabId ? `${meta.collabId}/${l.lobbyId}` : l.lobbyId));
	}
	return (meta.campaigns ?? []).map((c) => c.campaignNameId);
}

/**
 * A lobby discovered inside a collab mod.
 * Maps to `Maps/<CollabName>/<LobbyId>/` — a folder containing level .bins.
 * The optional `meta` is read from `<LobbyBin>.meta.yaml`, which may define
 * stickers, complete-screen, and other lobby-level presentation.
 */
export type DiscoveredLobby = {
	lobbyId: string;
	maps: DiscoveredMap[];
	meta?: MapMetaYaml;
};

/**
 * Side of a Celeste map, detected from the SID suffix:
 * - `"A"` — A-side (default, no suffix or `-A`)
 * - `"B"` — B-side (suffix `-B` / `_B`)
 * - `"C"` — C-side (suffix `-C` / `_C`)
 */
export type MapSide = "A" | "B" | "C";

/**
 * Parsed content of a `<MapBin>.meta.yaml` file sitting beside a .bin.
 * These YAML files control per-map presentation: mountain model, complete screen,
 * postcard, vignette text, fog/lighting, randomized flags, stickers, etc.
 */
export type MapMetaYaml = {
	icon?: string;
	interlude?: boolean;
	completeScreen?: { atlas?: string; [key: string]: unknown };
	loadingVignetteText?: { dialog?: string };
	postcard?: { texture?: string };
	canFullClear?: boolean;
	cassetteNeededForFullClear?: boolean;
	heartNeededForFullClear?: boolean;
	overrideASideMeta?: boolean;
	introType?: string;
	dreaming?: boolean;
	colorGrade?: string;
	darknessAlpha?: number;
	bloomBase?: number;
	bloomStrength?: number;
	coreMode?: string;
	collabUtilsRandomizedFlags?: Record<string, number>;
	stickers?: { path: string; finishedMaps: string[]; x?: number; y?: number; scale?: number; rotation?: number }[];
	[key: string]: unknown;
};

/**
 * A single map discovered on disk.
 *
 * Each `.bin` file inside the mod's `Maps/` directory corresponds to one map.
 * The SID (string ID) is derived from the path after `Maps/`, e.g.
 * `Maps/bryse0n/berry143/berry143.bin` → sid `"bryse0n/berry143/berry143"`.
 *
 * - `side` — detected from the SID suffix (`-B` / `-C`)
 * - `baseSid` — SID without the side suffix (e.g. `"map/foo"` from `"map/foo-B"`)
 * - `meta` — parsed `<bin>.meta.yaml` if it exists
 * - `altSidesHelperMeta` — parsed `<bin>.altsideshelper.meta.yaml` if it exists
 * - `name` — display name looked up from `Dialog/English.txt` via the SID-derived dialog key
 */
export type DiscoveredMap = {
	sid: string;
	side: MapSide;
	baseSid: string;
	binFileName: string;
	binPath: string;
	meta?: MapMetaYaml;
	altSidesHelperMeta?: AltSidesHelperMeta;
};

/**
 * A campaign group — maps belonging to the same subfolder under `Maps/`.
 *
 * For non-collab mods the folder structure is:
 *   `Maps/<Author>/<CampaignName>/` — one folder per campaign.
 * Example: `Maps/bryse0n/berry143/` → campaignNameId `"bryse0n/berry143"`.
 */
export type DiscoveredCampaign = {
	campaignNameId: string;
	maps: DiscoveredMap[];
};

// ──────────────────────────────────────────────
// YAML Parsing
// ──────────────────────────────────────────────

/**
 * Raw structure of a single dependency entry as it appears in `everest.yaml`.
 * The YAML may use either capitalized (`Name`, `Version`) or lowercase keys.
 */
interface RawDep {
	Name?: string;
	name?: string;
	Version?: string | number;
	version?: string | number;
	[key: string]: unknown;
}

/**
 * Raw structure of the entire `everest.yaml` before normalization.
 * Supports both casing conventions for forward-compatibility with mods
 * that may use either style.
 */
interface RawMeta {
	Name?: string;
	name?: string;
	Version?: string | number;
	version?: string | number;
	DLL?: string;
	dll?: string;
	Dependencies?: RawDep[];
	dependencies?: RawDep[];
	OptionalDependencies?: RawDep[];
	optionalDependencies?: RawDep[];
	[key: string]: unknown;
}

/** Normalize a raw YAML dependency to a typed `ModDependency`. */
function normalizeDep(d: RawDep): ModDependency {
	return {
		name: d.Name || d.name || "",
		version: String(d.Version ?? d.version ?? ""),
	};
}

/** Parse a YAML string; return `undefined` on failure (with console error). */
function parseYaml<T>(content: string, fileName: string): T | undefined {
	try {
		const cleaned = content.replace(/\0/g, "").replace(/^\uFEFF/, "");
		return (yaml.load(cleaned) as T | null | undefined) ?? undefined;
	} catch (err) {
		console.error(`Yaml parse fail ${fileName}:`, err);
		return undefined;
	}
}

/**
 * Parse the content of `everest.yaml` / `everest.yml` into a partial `ModMetadata`.
 *
 * The capitalized raw keys (`Name`, `Version`, `DLL`, `Dependencies`,
 * `OptionalDependencies`) are destructured out to avoid duplicating the
 * normalized lowercase forms. All other YAML keys pass through via `...rest`.
 *
 * The returned metadata starts with `isLobby: false` and empty `chapters`/
 * `campaigns` arrays; `GetModsInstalledFull` fills these in. The fast
 * `GetModsInstalled` overrides to `isLobby: true` for collab mods but
 * leaves map arrays empty.
 */
export function parseEverestYaml(content: string, fileName: string): ModMetadata {
	try {
		const cleaned = content.replace(/\0/g, "").replace(/^\uFEFF/, "");
		const parsed = yaml.load(cleaned) as RawMeta | RawMeta[] | null | undefined;
		if (!parsed) return { name: "", version: "", dependencies: [], isLobby: false, chapters: [], campaigns: [] };
		const item = Array.isArray(parsed) ? parsed[0] : parsed;
		const { Name, Version, DLL, Dependencies, OptionalDependencies, ...rest } = item;
		return {
			...rest,
			name: Name || rest.name || "",
			version: String(Version ?? rest.version ?? ""),
			dll: DLL || rest.dll || undefined,
			dependencies: (Dependencies || rest.dependencies || []).map(normalizeDep),
			optionalDependencies: (OptionalDependencies || rest.optionalDependencies || []).map(normalizeDep),
			isLobby: false,
			chapters: [],
			campaigns: [],
		};
	} catch (err) {
		console.error(`Yaml parse fail ${fileName}:`, err);
		return { name: "", version: "", dependencies: [], isLobby: false, chapters: [], campaigns: [] };
	}
}

/**
 * File names (case variants) for the mod metadata YAML.
 * Everest Core looks for these at the root of each mod folder/.zip.
 */
export const YAML_NAMES = ["everest.yaml", "everest.yml", "Everest.yaml", "Everest.yml"];

// ──────────────────────────────────────────────
// SID / Path Helpers
// ──────────────────────────────────────────────

/**
 * Derive a map's SID from its path within the mod's `Maps/` directory.
 *
 * The SID is the path relative to `Maps/` with the `.bin` extension removed.
 * Example: `"Maps/bryse0n/berry143/berry143.bin"` → `"bryse0n/berry143/berry143"`
 *
 * Returns `undefined` if the path is not under `Maps/`.
 */
export function deriveSid(binPath: string): string | undefined {
	const normalized = binPath.replace(/\\/g, "/");
	if (!normalized.startsWith("Maps/")) return undefined;
	return normalized.replace(/\.bin$/i, "").slice("Maps/".length);
}

/**
 * Strip the side suffix from a SID.
 * `"map/foo-B"` → `"map/foo"`, `"map/bar-C"` → `"map/bar"`, `"map/baz"` → `"map/baz"`
 */
export function baseSid(sid: string): string {
	return sid.replace(/-(B|C|H|X)$/i, "");
}

/**
 * Detect the Celeste map side from the SID suffix.
 * - `-B` / `_B` → `"B"`
 * - `-C` / `_C` → `"C"`
 * - any other   → `"A"`
 */
export function detectMapSide(sid: string): MapSide {
	if (/[_-]C$/i.test(sid)) return "C";
	if (/[_-]B$/i.test(sid)) return "B";
	return "A";
}

// ──────────────────────────────────────────────
// String Similarity (no deps)
// ──────────────────────────────────────────────

/** Standard Levenshtein edit distance (O(n) space). */
function levenshtein(a: string, b: string): number {
	const m = a.length,
		n = b.length;
	const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
	for (let i = 1; i <= m; i++) {
		let prev = dp[0];
		dp[0] = i;
		for (let j = 1; j <= n; j++) {
			const tmp = dp[j];
			dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(dp[j], dp[j - 1], prev);
			prev = tmp;
		}
	}
	return dp[n];
}

/**
 * Score how well `query` matches `candidate` (0–1).
 * 1.0 = exact match (case-insensitive)
 * 0.9 = substring containment
 * else = 1 − normalized Levenshtein distance
 */
export function modNameSimilarity(query: string, candidate: string): number {
	const a = query.toLowerCase().trim();
	const b = candidate.toLowerCase().trim();
	if (a === b) return 1;
	if (b.includes(a) || a.includes(b)) return 0.9;
	const dist = levenshtein(a, b);
	return 1 - dist / Math.max(a.length, b.length);
}

/** Options for controlling mod scanning behaviour. */
export type ScanOptions = {
	/** Max number of mods to scan (0 = no limit). */
	modsCountScanningLimit?: number;
	/** Number of parallel batches for scanning. Mods within a batch run sequentially. Default 5. */
	batchCount?: number;
	/** Number of web workers to use for parallel scanning (0 = no workers, uses batchCount batching). */
	workerCount?: number;
};

// ──────────────────────────────────────────────
// Everest Class
// ──────────────────────────────────────────────

/**
 * Main entry point for scanning Celeste mods on disk.
 *
 * Orchestrates:
 * 1. Finding mods in the Celeste `Mods/` directory
 * 2. Parsing `everest.yaml` for metadata
 * 3. Detecting collab vs standalone structure
 * 4. Scanning map files and associated YAML metadata
 * 5. Reading dialog files for display-name lookup
 *
 * Uses tsyringe DI — sub-modules (`CollabUtils2Scanner`, `DialogReader`)
 * are injected and handle domain-specific logic.
 */
@injectable()
export default class Everest {
	constructor(
		@inject(Celeste) private celesteDep: Celeste,
		@inject(Zip_Go) private zip: Zip_Go,
		@inject(IFileSystem_Token) private fs: IFileSystem,
		@inject(CollabUtils2Scanner) private collabUtils2: CollabUtils2Scanner,
		@inject(DialogReader) private dialogReader: DialogReader,
		@inject(IThreadConstructor_Token) private ThreadCtor: IThreadConstructor,
	) {}

	/**
	 * Derive a human-readable mod name from its folder or .zip file name.
	 * Strips version prefixes (e.g. `"1.0.0-MyMod_"` → `"My Mod"`),
	 * replaces underscores with spaces, and splits camelCase.
	 */
	public NormalizeCelesteModName(filename: string): string {
		let name = filename.replace(/\.(zip|txt)$/i, "");
		name = name.replace(/^(\d+\.)+\d+[-]+/, "");
		name = name.replace(/_/g, " ");
		name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
		return name.trim();
	}

	/**
	 * Resolve the path to the Celeste `Mods/` directory.
	 * Returns `null` if Celeste is not installed or the path is inaccessible.
	 */
	public async GetInstallationPath(): Promise<string | null> {
		const install = await this.celesteDep.GetInstallationPath();
		return install ? `${install.foundPath}/Mods` : null;
	}

	/** Single-slot read of the mod/LevelSet side of one `.celeste` save file — see `EverestHistoricalLevelSets`. */
	public async ReadHistoricalLevelSetNames(fileAbsolutePath: string): Promise<EverestHistoricalLevelSets> {
		try {
			const content = await this.fs.readFile(fileAbsolutePath);
			const parsed = saveFileXmlParser.parse(content)?.SaveData;
			const extractNames = (block: unknown): string[] => {
				const list = (block as { LevelSetStats?: { "@_Name"?: string }[] } | undefined)?.LevelSetStats;
				if (!Array.isArray(list)) return [];
				return list.map((entry) => entry?.["@_Name"]).filter((name): name is string => typeof name === "string" && name !== "");
			};

			return {
				installedLevelSetNames: extractNames(parsed?.LevelSets),
				recycledLevelSetNames: extractNames(parsed?.LevelSetRecycleBin),
			};
		} catch (e: unknown) {
			Log_Error("Everest:", `| Failed to read/parse historical LevelSets from "${fileAbsolutePath}" |`, serializeError(e));
			return { installedLevelSetNames: [], recycledLevelSetNames: [] };
		}
	}

	/** Unions + dedupes `ReadHistoricalLevelSetNames` across every save slot (`Celeste.GetAllSaveSlots`). */
	public async GetAllHistoricalLevelSetNames(): Promise<EverestHistoricalLevelSets> {
		const slots = await this.celesteDep.GetAllSaveSlots();
		const settled = await Promise.allSettled(slots.map((slot) => this.ReadHistoricalLevelSetNames(slot.fileAbsolutePath)));

		const installed = new Set<string>();
		const recycled = new Set<string>();
		for (const r of settled) {
			if (r.status !== "fulfilled") continue;
			for (const name of r.value.installedLevelSetNames) installed.add(name);
			for (const name of r.value.recycledLevelSetNames) recycled.add(name);
		}
		return { installedLevelSetNames: [...installed], recycledLevelSetNames: [...recycled] };
	}

	/** Read a file from a mod — either from a .zip archive or a loose folder. */
	private async readModFile(modPath: string, isZip: boolean, filePath: string): Promise<string> {
		return isZip ? await this.zip.readTextFile(modPath, filePath) : await this.fs.readFile(`${modPath}/${filePath}`);
	}

	/** List all files inside a subdirectory of a mod (recursive). */
	private async walkModDir(modPath: string, isZip: boolean, subDir: string): Promise<string[]> {
		if (isZip) {
			const allFiles = await this.zip.list(modPath);
			const prefix = `${subDir.replace(/\//g, "\\")}\\`;
			return allFiles
				.filter((f) => f.startsWith(`${subDir}/`) || f.startsWith(prefix))
				.map((f) => f.replace(/\\/g, "/"))
				.sort();
		}
		const entries = await this.fs.readDirectory(`${modPath}/${subDir}`, { recursive: true });
		return entries.map((e: DirectoryEntry) => `${subDir}/${e.entry}`).sort();
	}

	/**
	 * Try to read a companion YAML meta file for a .bin map.
	 * The meta file path is the bin path with `.bin` replaced by `ext`.
	 * @example tryReadMeta(info, "Maps/foo/bar.bin", ".meta.yaml") → reads "Maps/foo/bar.meta.yaml"
	 */
	private async tryReadMeta<T>(modInfo: EverestModInfo, binPath: string, ext: string): Promise<T | undefined> {
		try {
			const metaPath = binPath.replace(/\.bin$/i, ext);
			const content = await this.readModFile(modInfo.modPath, modInfo.isZip, metaPath);
			return parseYaml<T>(content, metaPath);
		} catch {
			return undefined;
		}
	}

	// ── Public API ──

	/**
	 * Lightweight scan — basic metadata only, no map traversal.
	 *
	 * For each mod:
	 * 1. Parses `everest.yaml` (name, version, deps)
	 * 2. Detects collab status via `CollabUtils2CollabID.txt`
	 *
	 * No map / dialog / lobby scanning — use `GetModsInstalledFull` for full data.
	 */
	public async GetModsInstalled(opts?: ScanOptions): Promise<EverestModInfo[]> {
		return this.scanModsBase(opts);
	}

	/**
	 * Full scan — basic metadata + complete campaign/lobby/map structure + dialog names.
	 *
	 * Extends the base scan with:
	 * - Campaign discovery (non-collab) or lobby/gym/prologue scan (collab)
	 * - Map metadata (`*.meta.yaml`, `*.altsideshelper.meta.yaml`)
	 * - Dialog file parsing for display-name resolution
	 * - Lazy-loading config reading
	 *
	 * Mods are split into `batchCount` (default 5) parallel batches;
	 * within each batch mods are scanned sequentially to control I/O concurrency.
	 */
	public async GetModsInstalledFull(opts?: ScanOptions): Promise<EverestModInfo[]> {
		const mods = await this.scanModsBase(opts);

		// Size capture — one lightweight stat pass, cached alongside everything else this
		// scan produces (see LocalMods.ts), so ModsSearch never has to stat files itself.
		await Promise.allSettled(
			mods.map(async (mod) => {
				if (!mod.isZip) {
					mod.sizeBytes = null; // folder mods: fs.getStats gives the OS directory-entry size, not a real recursive size
					return;
				}
				try {
					mod.sizeBytes = (await this.fs.getStats(mod.modPath)).size;
				} catch {
					mod.sizeBytes = null;
				}
			}),
		);

		const batchCount = Math.max(1, opts?.batchCount ?? 5);
		const chunks: EverestModInfo[][] = Array.from({ length: batchCount }, () => []);
		mods.forEach((m, i) => chunks[i % batchCount].push(m));

		await Promise.all(
			chunks.map(async (chunk) => {
				for (const modInfo of chunk) {
					try {
						const collabId = await this.collabUtils2.detectCollabId(modInfo);
						if (collabId) {
							const [dialog, lazyLoadingCfg] = await Promise.all([this.dialogReader.readDialog(modInfo), this.collabUtils2.readLazyLoadingConfig(modInfo)]);
							const scan = await this.collabUtils2.scanCollab(modInfo, collabId, dialog, this.buildMap.bind(this));
							modInfo.metadata = {
								...modInfo.metadata,
								isLobby: true,
								lobbyChapters: scan.lobbies.map((l) => ({
									lobbyId: l.lobbyId,
									lobbyLevels: l.maps.map((m) => ({ chapterId: m.sid })),
								})),
								collabId,
								lazyLoadingCfg,
								lobbies: scan.lobbies,
								gyms: scan.gyms,
								prologue: scan.prologue,
							};
						} else {
							const campaigns = await this.scanFlatCampaigns(modInfo);
							const chapters: ModChapter[] = [];
							for (const c of campaigns) {
								for (const m of c.maps) chapters.push({ chapterId: m.sid });
							}
							modInfo.metadata = {
								...modInfo.metadata,
								isLobby: false,
								chapters,
								campaigns,
							};
						}
					} catch {
						/* skip mod on scan error */
					}
				}
			}),
		);
		console.log("--------- FINISHED SCANNING FULL EVEREST METADATA AND LOBBY STUFF AND DIALOG --------------");
		return mods;
	}

	/**
	 * Base scan shared by both `GetModsInstalled` and `GetModsInstalledFull`.
	 * Only reads everest.yaml + collab ID file — no map/dialog traversal.
	 *
	 * Uses web workers when `workerCount > 0` (falling back to in-process batching).
	 * With batching, mods are split into `batchCount` (default 5) parallel groups.
	 */
	private async scanModsBase(opts?: ScanOptions): Promise<EverestModInfo[]> {
		const modsPath = await this.GetInstallationPath();
		if (!modsPath || !(await this.fs.exists(modsPath))) return [];

		let entries = await this.fs.readDirectory(modsPath);
		if (opts?.modsCountScanningLimit && opts.modsCountScanningLimit > 0) {
			entries = entries.slice(0, opts.modsCountScanningLimit);
		}

		const workerCount = opts?.workerCount ?? 0;
		if (workerCount > 0) {
			const result = await this.scanWithWorkers(entries, modsPath, workerCount);
			console.log(" ---------- FINISHED SCAN MOD BASE -----------------");
			if (result) return result;
		}

		return this.scanInBatches(entries, modsPath, Math.max(1, opts?.batchCount ?? 5));
	}

	/**
	 * Attempt to scan mods using a pool of web workers.
	 * Returns `null` if workers are not available (e.g. non-bun runtime).
	 */
	private async scanWithWorkers(entries: DirectoryEntry[], modsPath: string, workerCount: number): Promise<EverestModInfo[] | null> {
		try {
			const workerUrl = new URL("./Everest.worker.ts", import.meta.url);

			const workers = Array.from({ length: workerCount }, () => new this.ThreadCtor(workerUrl, { type: "module" }));

			// Pre-read all mod file content on main thread (via universal IFileSystem/Zip_Go)
			let no: number = 0;
			const preReadEntries = await Promise.all(
				entries.map(async ({ entry, type }) => {
					if (type === "DIRECTORY" && entry.toLowerCase().includes("cache")) return null;
					const isZip = type === "FILE" && entry.toLowerCase().endsWith(".zip");
					if (type !== "DIRECTORY" && !isZip) return null;

					console.log((++no).toString(), "|SCANNING MOD:", entry);

					const modPath = `${modsPath}/${entry}`;
					for (const yName of YAML_NAMES) {
						try {
							const yamlContent = await this.readModFile(modPath, isZip, yName);
							let collabContent: string | undefined;
							try {
								collabContent = await this.readModFile(modPath, isZip, "CollabUtils2CollabID.txt");
							} catch {
								/* not a collab */
							}
							return { entry, type, modPath, yamlContent, collabContent };
						} catch {
							/* try next yaml name */
						}
					}
					return null;
				}),
			);

			const valid = preReadEntries.filter(Boolean) as { entry: string; type: string; modPath: string; yamlContent: string; collabContent?: string }[];

			const chunks = Array.from({ length: workerCount }, () => [] as typeof valid);
			valid.forEach((e, i) => chunks[i % workerCount].push(e));

			const results = await Promise.all(
				workers.map(
					(w, i) =>
						new Promise<EverestModInfo[]>((resolve) => {
							const timeout = setTimeout(() => {
								w.terminate();
								resolve([]);
							}, 120_000);
							w.addEventListener("message", (e: any) => {
								clearTimeout(timeout);
								resolve(e.data.mods ?? []);
							});
							w.addEventListener("error", () => {
								clearTimeout(timeout);
								resolve([]);
							});
							w.postMessage({ entries: chunks[i], taskId: i });
						}),
				),
			);

			for (const w of workers) w.terminate();
			return results.flat();
		} catch {
			return null;
		}
	}

	/**
	 * Scan mods in-process using batched concurrency.
	 * Mods are split into `batchCount` round-robin groups; each group runs sequentially,
	 * all groups run in parallel via Promise.all.
	 */
	private async scanInBatches(entries: DirectoryEntry[], modsPath: string, batchCount: number): Promise<EverestModInfo[]> {
		const chunks: DirectoryEntry[][] = Array.from({ length: batchCount }, () => []);
		entries.forEach((e, i) => chunks[i % batchCount].push(e));

		const chunkResults = await Promise.all(
			chunks.map(async (chunk) => {
				const batch: EverestModInfo[] = [];
				for (const { entry, type } of chunk) {
					const result = await this.scanSingleMod(modsPath, entry, type);
					if (result) batch.push(result);
				}
				return batch;
			}),
		);

		return chunkResults.flat();
	}

	/** Scan a single mod entry: read everest.yaml + detect collab ID. */
	private async scanSingleMod(modsPath: string, entry: string, type: string): Promise<EverestModInfo | null> {
		if (type === "DIRECTORY" && entry.toLowerCase().includes("cache")) return null;
		const isZip = type === "FILE" && entry.toLowerCase().endsWith(".zip");
		if (type !== "DIRECTORY" && !isZip) return null;

		const modPath = `${modsPath}/${entry}`;
		const name = this.NormalizeCelesteModName(entry);

		for (const yName of YAML_NAMES) {
			try {
				const content = await this.readModFile(modPath, isZip, yName);
				const metadata = parseEverestYaml(content, entry);
				const modInfo: EverestModInfo = { fileName: entry, isZip, modPath, metadata, humanName: name };

				const collabId = await this.collabUtils2.detectCollabId(modInfo);
				if (collabId) {
					modInfo.metadata = {
						...modInfo.metadata,
						isLobby: true,
						collabId,
						lobbyChapters: [],
						lobbies: [],
						gyms: [],
					};
				}

				return modInfo;
			} catch {
				/* next yaml name */
			}
		}
		return null;
	}

	/**
	 * Find a mod by its exact folder or .zip filename (case-insensitive).
	 *
	 * Much faster than `GetModInfo` / `GetModInfoFull` — no fuzzy matching,
	 * no scanning all mods. Only reads and parses the one matching mod.
	 *
	 * @param modFileName - e.g. `"Berry 143"` or `"Berry 143.zip"`
	 */
	public async GetModInfoByZipName(modFileName: string): Promise<EverestModInfo | undefined> {
		const modsPath = await this.GetInstallationPath();
		if (!modsPath || !(await this.fs.exists(modsPath))) return undefined;

		const input = modFileName.replace(/\.zip$/i, "").toLowerCase();
		const entries = await this.fs.readDirectory(modsPath);

		for (const { entry, type } of entries) {
			if (type === "DIRECTORY" && entry.toLowerCase().includes("cache")) continue;
			const isZip = type === "FILE" && entry.toLowerCase().endsWith(".zip");
			if (type !== "DIRECTORY" && !isZip) continue;

			const entryName = entry.replace(/\.zip$/i, "");
			if (entryName.toLowerCase() !== input) continue;

			const modPath = `${modsPath}/${entry}`;
			const name = this.NormalizeCelesteModName(entry);

			for (const yName of YAML_NAMES) {
				try {
					const content = await this.readModFile(modPath, isZip, yName);
					const metadata = parseEverestYaml(content, entry);
					const modInfo: EverestModInfo = { fileName: entry, isZip, modPath, metadata, humanName: name };

					const collabId = await this.collabUtils2.detectCollabId(modInfo);
					if (collabId) {
						modInfo.metadata = {
							...modInfo.metadata,
							isLobby: true,
							collabId,
							lobbyChapters: [],
							lobbies: [],
							gyms: [],
						};
					}

					return modInfo;
				} catch {
					/* next yaml name */
				}
			}
		}
		return undefined;
	}

	// /**
	//  * Find a single mod by name using fuzzy string matching.
	//  * Uses the lightweight `GetModsInstalled` (fast, no map scan).
	//  */
	// public async GetModInfo(modName: string): Promise<EverestModInfo | undefined> {
	// 	return this.findMod(modName, false);
	// }

	/**
	 * Find a single mod with full metadata by name using fuzzy string matching.
	 * Uses the full `GetModsInstalledFull` (slower, includes maps/lobbies/dialog).
	 */
	// public async GetModInfoFull(modName: string): Promise<EverestModInfo | undefined> {
	// 	return this.findMod(modName, true);
	// }

	// private async findMod(modName: string, full: boolean): Promise<EverestModInfo | undefined> {
	// 	const mods = full ? await this.GetModsInstalledFull() : await this.GetModsInstalled();
	// 	if (!mods.length) return undefined;

	// 	let best: EverestModInfo | undefined;
	// 	let bestScore = 0;

	// 	for (const mod of mods) {
	// 		const candidates = [mod.name, mod.metadata.name, mod.fileName.replace(/\.zip$/i, '')].filter(Boolean);
	// 		for (const c of candidates) {
	// 			const score = modNameSimilarity(modName, c);
	// 			if (score > bestScore) {
	// 				bestScore = score;
	// 				best = mod;
	// 			}
	// 		}
	// 	}

	// 	return bestScore > 0.4 ? best : undefined;
	// }

	// ── Non-Collab: Flat Campaign Scan ──
	// Maps/<Author>/<Campaign>/<Chapter>.bin  — one level of folders

	/**
	 * Scan a non-collab mod for flat campaign structure.
	 *
	 * Walks the mod's `Maps/` directory, groups .bin files by their first
	 * two path segments (`<Author>/<Campaign>`), builds each map with
	 * metadata and dialog name resolution, and returns the grouped campaigns.
	 */
	private async scanFlatCampaigns(modInfo: EverestModInfo): Promise<DiscoveredCampaign[]> {
		const binFiles = await this.walkModDir(modInfo.modPath, modInfo.isZip, "Maps");
		const bins = binFiles.filter((f) => f.toLowerCase().endsWith(".bin"));

		const dialog = await this.dialogReader.readDialog(modInfo);

		const mapsWithCampaign = await Promise.all(
			bins.map(async (binPath) => {
				const sid = deriveSid(binPath);
				if (!sid) return null;
				const parts = sid.split("/");
				if (parts.length < 3) return null;
				const map = await this.buildMap(modInfo, binPath, sid, dialog);
				return { map, campaignId: parts.slice(0, -1).join("/") };
			}),
		);

		const campaignMap = new Map<string, DiscoveredMap[]>();
		for (const item of mapsWithCampaign) {
			if (!item) continue;
			const maps = campaignMap.get(item.campaignId) ?? [];
			maps.push(item.map);
			campaignMap.set(item.campaignId, maps);
		}

		return Array.from(campaignMap.entries()).map(([campaignNameId, maps]) => ({ campaignNameId, maps }));
	}

	// ── Map Builder ──

	/**
	 * Build a `DiscoveredMap` from a .bin file path.
	 *
	 * Reads companion YAML files:
	 * - `<bin>.meta.yaml` → `meta`
	 * - `<bin>.altsideshelper.meta.yaml` → `altSidesHelperMeta`
	 *
	 * Also looks up the display name from the mod's dialog file using the
	 * SID-derived dialog key (e.g. `bryse0n_berry143_berry143`).
	 */
	private async buildMap(modInfo: EverestModInfo, binPath: string, sid: string, dialog: Map<string, string>): Promise<DiscoveredMap> {
		const [meta, altSidesHelperMeta] = await Promise.all([
			this.tryReadMeta<MapMetaYaml>(modInfo, binPath, ".meta.yaml"),
			this.tryReadMeta<AltSidesHelperMeta>(modInfo, binPath, ALT_SIDES_META_EXT),
		]);

		const map: DiscoveredMap = {
			sid,
			side: detectMapSide(sid),
			baseSid: baseSid(sid),
			binFileName: binPath.split("/").pop() ?? "",
			binPath,
			meta,
			altSidesHelperMeta,
		};

		const dk = sidToDialogKey(sid);
		if (dialog.has(dk)) (map as Record<string, unknown>).name = dialog.get(dk);

		return map;
	}
}
