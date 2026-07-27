// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: DI Needed
import { injectable } from "tsyringe";
import Generic_Go from "./Generic_Go";

@injectable()
export default class Zip_Go extends Generic_Go {
	private async executeInternal<R>(binaryBaseName: string, args: string): Promise<R> {
		const exePath = await this.GetExecutablePath(binaryBaseName);
		const cmd = `"${exePath}" ${args}`;

		const response = await this.os.execCommand(cmd);

		if (response.exitCode !== 0) {
			try {
				const parsed = JSON.parse(response.stdOut);
				if (parsed && typeof parsed === "object" && "success" in parsed && !parsed.success) {
					throw new Error(parsed.error || "Operation failed");
				}
			} catch {}
			throw new Error(response.stdErr || `CLI helper '${binaryBaseName}' exited with code ${response.exitCode}`);
		}

		const parsed = JSON.parse(response.stdOut);
		if (!parsed.success) {
			throw new Error(parsed.error || "Operation failed");
		}
		return parsed as R;
	}

	public async scanModsBatch(modsDir: string, opts?: { threads?: number }): Promise<ZipScanModsResult> {
		const threadsArg = opts?.threads ? ` --threads ${opts.threads}` : "";
		return this.executeInternal<ZipScanModsResult>("CelesteModsParser", `scan-mods --dir "${modsDir}"${threadsArg}`);
	}

	public async countCollectibles(modPath: string): Promise<MapCollectiblesResult> {
		return this.executeInternal<MapCollectiblesResult>("CelesteMapsBinParser", `count-collectibles --mod "${modPath}"`);
	}

	public async exportMapImages(opts: { modPath: string; mapSid: string; outputDir: string }): Promise<ExportMapImagesResult> {
		return this.executeInternal<ExportMapImagesResult>(
			"CelesteMapsBinParser",
			`export-map-images --mod "${opts.modPath}" --map "${opts.mapSid}" --out "${opts.outputDir}"`,
		);
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
	maps?: Record<string, MapCollectibleCounts>;
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

export interface MapRoomManifestEntry {
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	image: string;
}

export interface ExportMapImagesResult {
	success: boolean;
	mapSid?: string;
	fullMapPng?: string;
	rooms?: MapRoomManifestEntry[];
	outDir?: string;
	error?: string;
}
