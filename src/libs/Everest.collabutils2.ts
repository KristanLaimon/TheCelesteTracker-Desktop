// UNIVERSAL COMPATIBILITY
/**
 * @fileoverview Collab mod scanning (CollabUtils2) for Everest mods.
 *
 * Collab mods are multi-author map packs with a structured layout:
 *   Maps/<CollabName>/
 *     ├── 0-Lobbies/          — .bin files representing each lobby stamp
 *     ├── 0-Gyms/             — .bin files for gym rooms
 *     ├── 0-Prologue<xxx>.bin — optional prologue lobby
 *     ├── <LobbyId>/          — level .bins assigned to that lobby
 *     └── ...
 *   CollabUtils2CollabID.txt      — contains the collab name identifier
 *   CollabUtils2LazyLoading.yaml  — optional config controlling lazy-load overrides
 *
 * This module handles detection of collab mods, lazy-loading config parsing,
 * and full structural scanning (lobbies, gyms, prologue).
 */

import * as yaml from "js-yaml";
import { inject, injectable } from "tsyringe";
import Zip_Go from "../../src-utils/Zip_Go";
import { IFileSystem_Token } from "../interfaces/DependencyInjectionTokens";
import type { DirectoryEntry, IFileSystem } from "../interfaces/IFileSystem";
import type { DiscoveredLobby, DiscoveredMap, EverestModInfo, MapMetaYaml } from "./Everest";

/**
 * Parsed content of `CollabUtils2LazyLoading.yaml`.
 *
 * Controls which map prefixes should skip loading their assets
 * in GUI or gameplay contexts, enabling the collab to defer
 * asset loading until the player actually visits a lobby.
 */
export type CollabUtils2LazyLoadingYaml = {
	enable: boolean;
	excludedPrefixes?: { gui?: string[]; gameplay?: string[]; [key: string]: unknown };
	[key: string]: unknown;
};

/** Derive a map SID from a path inside `Maps/`. */
function deriveSid(binPath: string): string | undefined {
	const normalized = binPath.replace(/\\/g, "/");
	if (!normalized.startsWith("Maps/")) return undefined;
	return normalized.replace(/\.bin$/i, "").slice("Maps/".length);
}

/**
 * Scans collab-specific mod structure.
 *
 * Handles:
 * - Detecting whether a mod is a collab via `CollabUtils2CollabID.txt`
 * - Parsing `CollabUtils2LazyLoading.yaml` for lazy-load config
 * - Walking the collab folder hierarchy to discover lobbies, gyms, levels, and prologue
 */
@injectable()
export class CollabUtils2Scanner {
	constructor(
		@inject(IFileSystem_Token) private fs: IFileSystem,
		@inject(Zip_Go) private zip: Zip_Go,
	) {}

	private async readModFile(modPath: string, isZip: boolean, filePath: string): Promise<string> {
		return isZip ? await this.zip.readTextFile(modPath, filePath) : await this.fs.readFile(`${modPath}/${filePath}`);
	}

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
	 * Detect whether a mod is a collab by checking for the `CollabUtils2CollabID.txt`
	 * file at the mod root. Returns the trimmed file contents (the collab name ID)
	 * if found, or `undefined` if the mod is not a collab.
	 */
	async detectCollabId(modInfo: EverestModInfo): Promise<string | undefined> {
		const names = ["CollabUtils2CollabID.txt", "collabutils2collabid.txt"];
		for (const name of names) {
			try {
				return (await this.readModFile(modInfo.modPath, modInfo.isZip, name)).trim();
			} catch {
				/* try next */
			}
		}
		return undefined;
	}

	/**
	 * Read and parse `CollabUtils2LazyLoading.yaml` from a collab mod's root.
	 * Returns `undefined` if the file doesn't exist (non-collab or no lazy-load config).
	 */
	async readLazyLoadingConfig(modInfo: EverestModInfo): Promise<CollabUtils2LazyLoadingYaml | undefined> {
		try {
			const content = await this.readModFile(modInfo.modPath, modInfo.isZip, "CollabUtils2LazyLoading.yaml");
			const cleaned = content.replace(/^\uFEFF/, "");
			return (yaml.load(cleaned) as CollabUtils2LazyLoadingYaml | null | undefined) ?? undefined;
		} catch {
			return undefined;
		}
	}

	/**
	 * Full structural scan of a collab mod.
	 *
	 * Walks `Maps/<collabName>/` and categorises all .bin files:
	 * - Files in `0-Lobbies/` → `DiscoveredLobby` entries (each with its levels)
	 * - `0-Prologue*` in lobby dir → `prologue` map
	 * - Files in `0-Gyms/` → `gyms` array
	 * - Files in `<LobbyId>/` → assigned as levels to the matching lobby
	 *
	 * All I/O per lobby, gym, and level is parallelized via Promise.all.
	 * Level bins are pre-grouped by lobbyId to avoid repeated linear scans.
	 */
	async scanCollab(
		modInfo: EverestModInfo,
		collabName: string,
		dialog: Map<string, string>,
		buildMap: (modInfo: EverestModInfo, binPath: string, sid: string, dialog: Map<string, string>) => Promise<DiscoveredMap>,
	): Promise<{ lobbies: DiscoveredLobby[]; gyms: DiscoveredMap[]; prologue?: DiscoveredMap }> {
		const baseDir = `Maps/${collabName}`;
		const allFiles = await this.walkModDir(modInfo.modPath, modInfo.isZip, baseDir);
		const bins = allFiles.filter((f) => f.toLowerCase().endsWith(".bin"));

		const lobbyBins = bins.filter((f) => f.startsWith(`${baseDir}/0-Lobbies/`));
		const gymBins = bins.filter((f) => f.startsWith(`${baseDir}/0-Gyms/`));
		const levelBins = bins.filter((f) => {
			if (f.startsWith(`${baseDir}/0-`)) return false;
			const rest = f.slice(`${baseDir}/`.length);
			return rest.includes("/") && !rest.startsWith("0-");
		});

		// Pre-group level bins by lobbyId (single pass)
		const levelsByLobby = new Map<string, string[]>();
		for (const lb of levelBins) {
			const lid = lb.slice(`${baseDir}/`.length).split("/")[0];
			const group = levelsByLobby.get(lid) ?? [];
			group.push(lb);
			levelsByLobby.set(lid, group);
		}

		// Process all lobby bins in parallel
		const lobbyResults = await Promise.all(
			lobbyBins.map(async (binPath) => {
				const sid = deriveSid(binPath);
				if (!sid) return null;
				const lobbyId = sid.split("/").pop()!;

				// Prologue detection
				if (/^0-Prologue/i.test(lobbyId)) {
					const prologue = await buildMap(modInfo, binPath, sid, dialog);
					return { type: "prologue" as const, prologue };
				}

				// Parallel level map building
				const levelPaths = levelsByLobby.get(lobbyId) ?? [];
				const levels = (
					await Promise.all(
						levelPaths.map(async (lb) => {
							const lsid = deriveSid(lb);
							return lsid ? buildMap(modInfo, lb, lsid, dialog) : null;
						}),
					)
				).filter((m): m is DiscoveredMap => m !== null);

				// Lobby meta
				let meta: MapMetaYaml | undefined;
				try {
					const c = await this.readModFile(modInfo.modPath, modInfo.isZip, binPath.replace(/\.bin$/i, ".meta.yaml"));
					meta = (yaml.load(c.replace(/^\uFEFF/, "")) as MapMetaYaml | null | undefined) ?? undefined;
				} catch {
					/* no meta */
				}

				return { type: "lobby" as const, lobbyId, maps: levels, meta };
			}),
		);

		// Process all gym bins in parallel
		const gyms = (
			await Promise.all(
				gymBins.map(async (binPath) => {
					const sid = deriveSid(binPath);
					return sid ? buildMap(modInfo, binPath, sid, dialog) : null;
				}),
			)
		).filter((m): m is DiscoveredMap => m !== null);

		// Split results into lobbies / prologue
		let prologue: DiscoveredMap | undefined;
		const lobbies: DiscoveredLobby[] = [];
		for (const r of lobbyResults) {
			if (!r) continue;
			if (r.type === "prologue") {
				prologue = r.prologue;
			} else {
				lobbies.push({ lobbyId: r.lobbyId, maps: r.maps as DiscoveredMap[], meta: r.meta });
			}
		}

		return { lobbies, gyms, prologue };
	}
}
