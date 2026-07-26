// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: DI Needed
import { injectable } from "tsyringe";
import Generic_Go from "./Generic_Go";

const windows_name = "zip_utils-win_x64.exe";
const macos_name = "zip_utils-mac_x64";
const linux_name = "zip_utils-linux_x64";

@injectable()
export default class Zip_Go extends Generic_Go {
	#executableCachedPath: string | null = null;

	public async GetExecutablePath(): Promise<string> {
		if (this.#executableCachedPath) {
			return this.#executableCachedPath;
		}

		const util_file_name: string = (() => {
			switch (this.os.getCurrentOS()) {
				case "windows":
					return windows_name;
				case "macos":
					return macos_name;
				case "linux":
					return linux_name;
				case "freebsd":
				case "unknown":
					throw new Error(`Zip_Go: Current os '${this.os.getCurrentOS()}' not supported`);
			}
		})();

		const currentExePath = await this.fs.getAbsolutePath(".");
		const possibleParentFolders = ["./", "./bin"];
		for (const folder of possibleParentFolders) {
			const pathToSearchOn = this.path.join(currentExePath, folder, util_file_name);
			if (await this.fs.exists(pathToSearchOn)) {
				this.#executableCachedPath = pathToSearchOn;
				return this.#executableCachedPath;
			}
		}

		throw new Error(`Zip_Go: Executable not found. Tried paths containing ${util_file_name}`);
	}

	private async executeInternal<R>(args: string): Promise<R> {
		const exePath = await this.GetExecutablePath();
		const cmd = `"${exePath}" ${args}`;

		const response = await this.os.execCommand(cmd);

		if (response.exitCode !== 0) {
			try {
				const parsed = JSON.parse(response.stdOut);
				if (parsed && typeof parsed === "object" && "success" in parsed && !parsed.success) {
					throw new Error(parsed.error || "Zip operation failed");
				}
			} catch {}
			throw new Error(response.stdErr || `Zip helper exited with code ${response.exitCode}`);
		}

		const parsed = JSON.parse(response.stdOut);
		if (!parsed.success) {
			throw new Error(parsed.error || "Zip operation failed");
		}
		return parsed as R;
	}

	public async readTextFile(zipPath: string, filePath: string): Promise<string> {
		const res = await this.executeInternal<{ content: string }>(`zip read --zip "${zipPath}" --file "${filePath}"`);
		return res.content;
	}

	public async list(zipPath: string): Promise<string[]> {
		const res = await this.executeInternal<{ files: string[] }>(`zip list --zip "${zipPath}"`);
		return res.files;
	}

	public async unzip(zipPath: string, destPath: string): Promise<void> {
		await this.executeInternal<void>(`zip unzip --zip "${zipPath}" --dest "${destPath}"`);
	}

	public async zip(srcPath: string, zipPath: string): Promise<void> {
		await this.executeInternal<void>(`zip pack --src "${srcPath}" --zip "${zipPath}"`);
	}

	public async scanModsBatch(modsDir: string, opts?: { threads?: number }): Promise<ZipScanModsResult> {
		const threadsArg = opts?.threads ? ` --threads ${opts.threads}` : "";
		return this.executeInternal<ZipScanModsResult>(`zip scan-mods --dir "${modsDir}"${threadsArg}`);
	}

	/**
	 * Count the collectibles placed in every map of one mod (zip or unpacked folder), keyed by SID.
	 *
	 * These are the *maximums* a player could collect; save files only ever report what was collected.
	 * See `docs/TheCelesteDesktop/CelesteMapBin_Format.md`.
	 */
	public async countCollectibles(modPath: string): Promise<MapCollectiblesResult> {
		return this.executeInternal<MapCollectiblesResult>(`zip count-collectibles --mod "${modPath}"`);
	}
}

export interface ScannedMapRaw {
	path: string;
	metaYaml?: string;
}

export interface ScannedModRaw {
	fileName: string;
	isZip: boolean;
	modPath: string;
	sizeBytes: number;
	yamlContent: string;
	collabId?: string;
	dialogFiles?: Record<string, string>;
	lazyLoadYaml?: string;
	mapFiles?: ScannedMapRaw[];
}

export interface MapCollectibleCounts {
	red: number;
	golden: number;
	wingedGolden: number;
	moon: number;
	hearts: number;
	miniHearts: number;
	silver: number;
	speed: number;
	rainbow: number;
	platinum: number;
}

export interface MapCollectiblesResult {
	success: boolean;
	/** Per-SID counts, e.g. `"Crylone/farshore/farshore"`. */
	maps?: Record<string, MapCollectibleCounts>;
	/** Per-SID parse errors; one broken map never fails the whole mod. */
	failed?: Record<string, string>;
	error?: string;
}

export interface ZipScanModsResult {
	success: boolean;
	modCount: number;
	threads: number;
	mods: ScannedModRaw[];
	error?: string;
}
