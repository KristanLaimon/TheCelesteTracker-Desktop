// UNIVERSAL COMPATIBILITY

import { XMLParser } from "fast-xml-parser";
import { serializeError } from "serialize-error";
import { inject, injectable } from "tsyringe";
import { IFileSystem_Token, IOs_Token } from "../core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../core/interfaces/IFileSystem";
import type { IOS } from "../core/interfaces/IOs";
import { celesteLogger } from "../utils/Logger";

export interface CelesteInstallation {
	foundPath: string;
	installationType: "steam" | "epicgames";
}

/** One save slot found in Celeste's `Saves/` folder (`N.celeste`). */
export type CelesteSaveSlot = {
	slotNumber: number;
	slotName: string;
	fileAbsolutePath: string;
};

/**
 * Vanilla-only top-level totals from a `.celeste` save file's `<SaveData>` root.
 * Never mod-aware — per-chapter `<Areas>` breakdown and mod `<LevelSets>` data
 * are out of scope here, see `Everest.ts` for the mod-domain layer built on top.
 */
export type CelesteVanillaSaveStats = {
	name: string;
	time: number;
	totalDeaths: number;
	totalStrawberries: number;
	totalGoldenStrawberries: number;
	totalJumps: number;
	totalWallJumps: number;
	totalDashes: number;
	unlockedAreas: number;
};

const saveFileXmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

@injectable()
export default class Celeste {
	private pathCache: Promise<CelesteInstallation | null> | null = null;

	constructor(
		@inject(IOs_Token) private os: IOS,
		@inject(IFileSystem_Token) private fs: IFileSystem,
	) {}

	public GetInstallationPath(): Promise<CelesteInstallation | null> {
		if (!this.pathCache) {
			this.pathCache = this.findPath();
		}
		return this.pathCache;
	}

	/** `<install>/Saves` — where `N.celeste` save-slot files and `TheCelesteTracker_DB.db` live. */
	public async GetSavesFolderPath(): Promise<string | null> {
		const install = await this.GetInstallationPath();
		if (!install) return null;
		return `${install.foundPath}/Saves`;
	}

	/**
	 * Lists every save slot (`N.celeste`) in the Saves folder, with its display name.
	 * Excludes `N-modsave-*.celeste` files (per-mod extra data, not save totals).
	 */
	public async GetAllSaveSlots(): Promise<CelesteSaveSlot[]> {
		const savesPath = await this.GetSavesFolderPath();
		if (!savesPath || !(await this.fs.exists(savesPath))) return [];

		const entries = await this.fs.readDirectory(savesPath);
		const slotFiles = entries.filter((e) => e.type === "FILE" && /^\d+\.celeste$/i.test(e.entry));

		const slots: CelesteSaveSlot[] = [];
		for (const entry of slotFiles) {
			const fileAbsolutePath = `${savesPath}/${entry.entry}`;
			const slotNumber = Number.parseInt(entry.entry, 10);
			try {
				const content = await this.fs.readFile(fileAbsolutePath);
				const parsed = saveFileXmlParser.parse(content);
				const slotName = String(parsed?.SaveData?.Name ?? "");
				slots.push({ slotNumber, slotName, fileAbsolutePath });
			} catch (e: unknown) {
				celesteLogger.error("Celeste: Failed to read/parse save slot", entry.entry, serializeError(e));
			}
		}
		return slots.sort((a, b) => a.slotNumber - b.slotNumber);
	}

	/** Single-slot read of vanilla-only totals from one `.celeste` save file. */
	public async ReadVanillaSaveStats(fileAbsolutePath: string): Promise<CelesteVanillaSaveStats | null> {
		try {
			const content = await this.fs.readFile(fileAbsolutePath);
			const parsed = saveFileXmlParser.parse(content)?.SaveData;
			if (!parsed) return null;

			return {
				name: String(parsed.Name ?? ""),
				time: Number(parsed.Time ?? 0),
				totalDeaths: Number(parsed.TotalDeaths ?? 0),
				totalStrawberries: Number(parsed.TotalStrawberries ?? 0),
				totalGoldenStrawberries: Number(parsed.TotalGoldenStrawberries ?? 0),
				totalJumps: Number(parsed.TotalJumps ?? 0),
				totalWallJumps: Number(parsed.TotalWallJumps ?? 0),
				totalDashes: Number(parsed.TotalDashes ?? 0),
				unlockedAreas: Number(parsed.UnlockedAreas ?? 0),
			};
		} catch (e: unknown) {
			celesteLogger.error("Celeste: Failed to read/parse vanilla save stats from", fileAbsolutePath, serializeError(e));
			return null;
		}
	}

	private async findPath(): Promise<CelesteInstallation | null> {
		const override = await this.os.getEnv("CTD_TEST_CELESTE_PATH");
		if (override) {
			for (const exe of ["Celeste.exe", "Celeste", "Celeste.app"]) {
				if (await this.fs.exists(`${override}/${exe}`)) return { foundPath: override, installationType: "steam" };
			}
			return null;
		}

		const osName = this.os.getCurrentOS();
		const targets: { path: string; type: "steam" | "epicgames" }[] = [];

		try {
			if (osName === "windows") {
				targets.push(
					{ path: "C:/Program Files (x86)/Steam/steamapps/common/Celeste", type: "steam" },
					{ path: "C:/Program Files/Steam/steamapps/common/Celeste", type: "steam" },
					{ path: "C:/Program Files/Epic Games/Celeste", type: "epicgames" },
				);
			} else {
				const home = await this.os.getPath("home");
				if (osName === "macos") {
					targets.push(
						{ path: `${home}/Library/Application Support/Steam/steamapps/common/Celeste`, type: "steam" },
						{ path: `${home}/Library/Application Support/Steam/steamapps/common/Celeste/Celeste.app/Contents/Resources`, type: "steam" },
					);
				} else {
					targets.push(
						{ path: `${home}/.local/share/Steam/steamapps/common/Celeste`, type: "steam" },
						{ path: `${home}/.steam/steam/steamapps/common/Celeste`, type: "steam" },
					);
				}
			}
		} catch (e) {
			celesteLogger.error("OS path fetch fail:", e);
		}

		for (const { path, type } of targets) {
			for (const exe of ["Celeste.exe", "Celeste", "Celeste.app"]) {
				if (await this.fs.exists(`${path}/${exe}`)) {
					return { foundPath: path, installationType: type };
				}
			}
		}

		return null;
	}
}
