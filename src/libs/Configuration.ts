// UNIVERSAL COMPATIBILITY
import { inject, injectable } from "tsyringe";
import { IFileSystem_Token, IOs_Token, IPath_Token } from "../interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../interfaces/IFileSystem";
import type { IOS } from "../interfaces/IOs";
import type { IPath } from "../interfaces/IPath";
import Storage from "./Storage";
import Storage_JsonFileAdapter from "./Storage.json";

const CONFIG_PATH = "./config.json";

@injectable()
export default class Configuration {
	private storage: Storage;

	constructor(
		@inject(IFileSystem_Token) private fs: IFileSystem,
		@inject(IPath_Token) private path: IPath,
		@inject(IOs_Token) private os: IOS,
	) {
		const adapter = new Storage_JsonFileAdapter({ filePath: CONFIG_PATH, indent: 2 }, this.fs, this.path);
		this.storage = new Storage({ adapters: [adapter] });
	}

	async initialize(): Promise<void> {
		const exists = await this.fs.exists(CONFIG_PATH);
		if (!exists) {
			await this.fs.writeFile(CONFIG_PATH, "{}");
		}
	}

	async getDataFolderPath(): Promise<string> {
		const stored = await this.storage.get<string>("dataFolderPath");
		if (stored) return stored;
		const override = await this.os.getEnv("CTD_TEST_DATA_FOLDER");
		return override || "./data";
	}

	async setDataFolderPath(value: string): Promise<void> {
		await this.storage.set("dataFolderPath", value);
	}

	async getDatabasePath(): Promise<string> {
		const base = await this.getDataFolderPath();
		return this.path.join(base, "db.sqlite");
	}

	async getCachePath(): Promise<string> {
		const base = await this.getDataFolderPath();
		return this.path.join(base, "cache");
	}

	async getAvatarsCachePath(): Promise<string> {
		const base = await this.getCachePath();
		return this.path.join(base, "avatars");
	}

	async getModScreenshotsCachePath(): Promise<string> {
		const base = await this.getCachePath();
		return this.path.join(base, "modsscreenshots");
	}

	async save(): Promise<void> {
		await this.storage.triggerSave();
	}
}
