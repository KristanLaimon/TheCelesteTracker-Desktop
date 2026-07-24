// UNIVERSAL COMPATIBILITY
import { serializeError } from "serialize-error";
import { inject, injectable } from "tsyringe";
import { IFileSystem_Token, IOs_Token, IPath_Token } from "../interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../interfaces/IFileSystem";
import type { IOS } from "../interfaces/IOs";
import type { IPath } from "../interfaces/IPath";
import { Log_Error } from "./Logger";

export const OlympusModCategory = ["Maps", "Helpers", "Tools", "Assets", "Skins", "UI", "Other/Misc", "Mechanics", "Dialog", "WiPs"] as const;
export type OlympusModCategory = (typeof OlympusModCategory)[number];

export type OlympusModToCategoryRegistry = Readonly<Record<string, OlympusModCategory>>;

export type OlympusModtoPrettyNameRegistry = Record<string, string | undefined>;

@injectable()
export default class Olympus {
	private _instalationPathCached: Promise<string | null> | null = null;
	private _nameToPrettyNameJsonCached: OlympusModtoPrettyNameRegistry = {};
	private _nameToCategoryJsonCached: OlympusModToCategoryRegistry = {};

	constructor(
		@inject(IOs_Token) private os: IOS,
		@inject(IFileSystem_Token) private fs: IFileSystem,
		@inject(IPath_Token) private path: IPath,
	) {}

	public async isInstalled(): Promise<boolean> {
		return (await this.GetInstallationPath()) !== null;
	}

	public GetInstallationPath(): Promise<string | null> {
		if (!this._instalationPathCached) {
			this._instalationPathCached = this._findPath();
		}
		return this._instalationPathCached;
	}

	public async GetModCategoryByModId(modEverestIdentiifier: string, opts?: { invalidateCache?: boolean }): Promise<string | null> {
		const path: string | null = await this.GetInstallationPath();
		if (path === null) return null;

		const infoJsonPath: string = this.path.join(path, "cached-mod-ids-to-categories.json");
		if (!(await this.fs.exists(infoJsonPath))) return null;

		const infoJsonContent: string = await this.fs.readFile(infoJsonPath);
		if (infoJsonContent === "") return null;

		let parsed: OlympusModToCategoryRegistry = {};
		try {
			parsed = JSON.parse(infoJsonContent);
		} catch (e: unknown) {
			Log_Error("Olympus:", "| Error when trying to parse cached-mod-ids-to-categories.json from olympus path |", serializeError(e));
			return null;
		}

		if (Object.keys(this._nameToCategoryJsonCached).length > 0) {
			this._nameToCategoryJsonCached = parsed;
		} else {
			if (opts?.invalidateCache) {
				this._nameToCategoryJsonCached = parsed;
			}
		}

		const found: string | null = parsed[modEverestIdentiifier] ?? null;
		if (typeof found === "string" && found === "") return null;
		return found;
	}

	/**
	 * Find the human readable name of mod given by Olympus. (Only if previously installed by user)
	 * Used as primary source for human-mod-name-conversion
	 * @param modEverestIdentifier Is the official mod identifier inside its everest.yaml
	 * @param opts Optional props
	 * @returns The pretty name given by Olympus only if found, otherwise null
	 */
	public async GetModHumanNameByModId(modEverestIdentifier: string, opts?: { invalidateCache?: boolean }): Promise<string | null> {
		const path: string | null = await this.GetInstallationPath();
		if (path === null) return null;

		const infoJsonPath: string = this.path.join(path, "cached-mod-ids-to-names.json");
		// "C:\Users\Kristan\AppData\Local\Olympus\cached-mod-ids-to-names.json" //real path
		// C:\\Users\\Kristan\\AppData\\local\\Olympus\\cached-mod-ids-to-names.json //path being returned by Path.join()
		if (!(await this.fs.exists(infoJsonPath))) return null;

		const infoJsonContent: string = await this.fs.readFile(infoJsonPath);
		if (infoJsonContent === "") return null;

		let parsed: OlympusModtoPrettyNameRegistry = {};
		try {
			parsed = JSON.parse(infoJsonContent);
		} catch (e: unknown) {
			Log_Error("Olympus:", "| Error when trying to parse cached-mod-ids-to-names.json from olympus path |", serializeError(e));
			return null;
		}

		if (Object.keys(this._nameToPrettyNameJsonCached).length === 0) {
			this._nameToPrettyNameJsonCached = parsed;
		} else {
			if (opts?.invalidateCache) {
				this._nameToPrettyNameJsonCached = parsed;
			}
		}

		const found: string | null = parsed[modEverestIdentifier] ?? null;
		if (typeof found === "string" && found === "") return null;
		return found;
	}

	//is C:\Users\Kristan\AppData\Local\Olympus
	//but code says: C:\\Users\\Kristan\\local\\Olympus\\config.json
	private async _findPath(): Promise<string | null> {
		const override = await this.os.getEnv("CTD_TEST_OLYMPUS_PATH");
		let configPath = override ? this.path.join(override, "config.json") : "";

		if (!override) {
			const osName = this.os.getCurrentOS();
			try {
				if (osName === "windows") {
					const data = await this.os.getPath("home");
					configPath = this.path.join(data, "AppData", "Local", "Olympus", "config.json");
				} else {
					const home = await this.os.getPath("home");
					if (osName === "macos") {
						//TODO: Test if real path in macos
						configPath = `${home}/Library/Application Support/Olympus/config.json`;
					} else {
						//TODO: Test if real path in linux
						configPath = `${home}/.config/Olympus/config.json`;
					}
				}
			} catch (e) {
				console.error("Failed to resolve Olympus config path:", e);
				return null;
			}
		}

		if (await this.fs.exists(configPath)) {
			return this.path.dirname(configPath);
		}

		return null;
	}
}
