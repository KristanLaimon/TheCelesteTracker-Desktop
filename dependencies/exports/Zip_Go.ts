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

		let parsed: { success?: boolean; error?: string; [key: string]: unknown } | undefined;
		if (response.stdOut?.trim()) {
			try {
				parsed = JSON.parse(response.stdOut.trim());
			} catch {
				// stdOut was not valid JSON
			}
		}

		if (response.exitCode !== 0) {
			const jsonError = parsed && typeof parsed === "object" && typeof parsed.error === "string" && parsed.error ? parsed.error : null;
			const detail = jsonError || response.stdErr?.trim() || response.stdOut?.trim() || `exit code ${response.exitCode}`;
			throw new Error(`Zip_Go CLI helper '${binaryBaseName}' failed: ${detail}`);
		}

		if (!parsed) {
			throw new Error(`Zip_Go CLI helper '${binaryBaseName}' failed to parse response JSON. Raw stdout: "${response.stdOut}"`);
		}

		if (!parsed.success) {
			throw new Error(`Zip_Go CLI helper '${binaryBaseName}' operation failed: ${parsed.error || "Unknown error"}`);
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

	public async exportMap(opts: {
		modPath: string;
		mapSid: string;
		outputDir: string;
		gridOnly?: boolean;
		celesteDir?: string;
	}): Promise<ExportMapImagesResult> {
		const gridOnlyArg = opts.gridOnly ? " --grid-only" : "";
		const celesteDirArg = opts.celesteDir ? ` --celeste-dir "${opts.celesteDir}"` : "";
		return this.executeInternal<ExportMapImagesResult>(
			"CelesteMapsBinParser",
			`export-map --mod "${opts.modPath}" --map "${opts.mapSid}" --out "${opts.outputDir}"${gridOnlyArg}${celesteDirArg}`,
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
