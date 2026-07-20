import * as yaml from 'js-yaml';
import { inject, injectable } from 'tsyringe';
import Zip_Go from '../../src-utils/Zip_Go';
import { IFileSystem_Token } from '../interfaces/DependencyInjectionTokens';
import type { IFileSystem, DirectoryEntry } from '../interfaces/IFileSystem';
import { CollabUtils2Scanner, type CollabUtils2LazyLoadingYaml } from './Everest.collabutils2';
import { DialogReader, sidToDialogKey } from './Everest.dialog';
import { ALT_SIDES_META_EXT, type AltSidesHelperMeta } from './Everest.altsideshelper';
import Celeste from './Celeste';

export type ModDependency = { name: string; version: string };

export type ModChapter = { chapterId: string };

export type LobbyChapter = {
	gymId?: string;
	lobbyId: string;
	lobbyLevels: ModChapter[];
};

export type ModMetadata =
	| {
			name: string;
			version: string;
			dll?: string;
			dependencies: ModDependency[];
			optionalDependencies?: ModDependency[];
			isLobby: true;
			lobbyChapters: LobbyChapter[];
			[key: string]: unknown;
	  }
	| {
			name: string;
			version: string;
			dll?: string;
			dependencies: ModDependency[];
			optionalDependencies?: ModDependency[];
			isLobby: false;
			chapters: ModChapter[];
			[key: string]: unknown;
	  };

export type EverestModInfo = {
	fileName: string;
	isZip: boolean;
	modPath: string;
	metadata: ModMetadata;
	name: string;
};

export type DiscoveredLobby = {
	lobbyId: string;
	maps: DiscoveredMap[];
	meta?: MapMetaYaml;
};

// ──────────────────────────────────────────────
// Shared Types
// ──────────────────────────────────────────────

export type MapSide = 'A' | 'B' | 'C';

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

export type DiscoveredMap = {
	sid: string;
	side: MapSide;
	baseSid: string;
	binFileName: string;
	binPath: string;
	meta?: MapMetaYaml;
	altSidesHelperMeta?: AltSidesHelperMeta;
};

export type DiscoveredCampaign = {
	campaignNameId: string;
	maps: DiscoveredMap[];
};

export type ModScanResult = {
	info: EverestModInfo;
	campaigns?: DiscoveredCampaign[];
	collabId?: string;
	lazyLoadingCfg?: CollabUtils2LazyLoadingYaml;
	lobbies?: DiscoveredLobby[];
	gyms?: DiscoveredMap[];
	prologue?: DiscoveredMap;
};

// ──────────────────────────────────────────────
// YAML Parsing
// ──────────────────────────────────────────────

interface RawDep {
	Name?: string;
	name?: string;
	Version?: string | number;
	version?: string | number;
	[key: string]: unknown;
}
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

function normalizeDep(d: RawDep): ModDependency {
	return {
		name: d.Name || d.name || '',
		version: String(d.Version ?? d.version ?? ''),
	};
}

function parseYaml<T>(content: string, fileName: string): T | undefined {
	try {
		return (yaml.load(content.replace(/^\uFEFF/, '')) as T | null | undefined) ?? undefined;
	} catch (err) {
		console.error(`Yaml parse fail ${fileName}:`, err);
		return undefined;
	}
}

export function parseEverestYaml(content: string, fileName: string): ModMetadata {
	try {
		const cleaned = content.replace(/^\uFEFF/, '');
		const parsed = yaml.load(cleaned) as RawMeta | RawMeta[] | null | undefined;
		if (!parsed) return { name: '', version: '', dependencies: [], isLobby: false, chapters: [] };
		const item = Array.isArray(parsed) ? parsed[0] : parsed;
		return {
			...item,
			name: item.Name || item.name || '',
			version: String(item.Version ?? item.version ?? ''),
			dll: item.DLL || item.dll || undefined,
			dependencies: (item.Dependencies || item.dependencies || []).map(normalizeDep),
			optionalDependencies: (item.OptionalDependencies || item.optionalDependencies || []).map(normalizeDep),
			isLobby: false,
			chapters: [],
		};
	} catch (err) {
		console.error(`Yaml parse fail ${fileName}:`, err);
		return { name: '', version: '', dependencies: [], isLobby: false, chapters: [] };
	}
}

export const YAML_NAMES = ['everest.yaml', 'everest.yml', 'Everest.yaml', 'Everest.yml'];

// ──────────────────────────────────────────────
// SID / Path Helpers
// ──────────────────────────────────────────────

export function deriveSid(binPath: string): string | undefined {
	const normalized = binPath.replace(/\\/g, '/');
	if (!normalized.startsWith('Maps/')) return undefined;
	return normalized.replace(/\.bin$/i, '').slice('Maps/'.length);
}

export function baseSid(sid: string): string {
	return sid.replace(/-(B|C|H|X)$/i, '');
}

export function detectMapSide(sid: string): MapSide {
	if (/[_-]C$/i.test(sid)) return 'C';
	if (/[_-]B$/i.test(sid)) return 'B';
	return 'A';
}

// ──────────────────────────────────────────────
// Everest Class
// ──────────────────────────────────────────────

@injectable()
export default class Everest {
	constructor(
		@inject(Celeste) private celesteDep: Celeste,
		@inject(Zip_Go) private zip: Zip_Go,
		@inject(IFileSystem_Token) private fs: IFileSystem,
		@inject(CollabUtils2Scanner) private collabUtils2: CollabUtils2Scanner,
		@inject(DialogReader) private dialogReader: DialogReader,
	) {}

	public NormalizeCelesteModName(filename: string): string {
		let name = filename.replace(/\.(zip|txt)$/i, '');
		name = name.replace(/^(\d+\.)+\d+[-]+/, '');
		name = name.replace(/_/g, ' ');
		name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
		return name.trim();
	}

	public async GetInstallationPath(): Promise<string | null> {
		const install = await this.celesteDep.GetInstallationPath();
		return install ? `${install.foundPath}/Mods` : null;
	}

	private async readModFile(modPath: string, isZip: boolean, filePath: string): Promise<string> {
		return isZip
			? await this.zip.readTextFile(modPath, filePath)
			: await this.fs.readFile(`${modPath}/${filePath}`);
	}

	private async walkModDir(modPath: string, isZip: boolean, subDir: string): Promise<string[]> {
		if (isZip) {
			const allFiles = await this.zip.list(modPath);
			const prefix = subDir.replace(/\//g, '\\') + '\\';
			return allFiles
				.filter(f => f.startsWith(subDir + '/') || f.startsWith(prefix))
				.map(f => f.replace(/\\/g, '/'))
				.sort();
		}
		const entries = await this.fs.readDirectory(`${modPath}/${subDir}`, { recursive: true });
		return entries.map((e: DirectoryEntry) => `${subDir}/${e.entry}`).sort();
	}

	private async tryReadMeta<T>(modInfo: EverestModInfo, binPath: string, ext: string): Promise<T | undefined> {
		try {
			const content = await this.readModFile(modInfo.modPath, modInfo.isZip, binPath.replace(/\.bin$/i, ext));
			return parseYaml<T>(content, binPath);
		} catch {
			return undefined;
		}
	}

	// ── Public API ──

	public async GetModsInstalled(opts?: { modsCountScanningLimit?: number }): Promise<EverestModInfo[]> {
		const modsPath = await this.GetInstallationPath();
		if (!modsPath || !(await this.fs.exists(modsPath))) return [];

		let entries = await this.fs.readDirectory(modsPath);
		if (opts?.modsCountScanningLimit && opts.modsCountScanningLimit > 0) {
			entries = entries.slice(0, opts.modsCountScanningLimit);
		}

		const mods: EverestModInfo[] = [];

		for (const { entry, type } of entries) {
			if (type === 'DIRECTORY' && entry.toLowerCase().includes('cache')) continue;
			const isZip = type === 'FILE' && entry.toLowerCase().endsWith('.zip');
			if (type !== 'DIRECTORY' && !isZip) continue;

			const modPath = `${modsPath}/${entry}`;
			const name = this.NormalizeCelesteModName(entry);

			for (const yName of YAML_NAMES) {
				try {
					const content = await this.readModFile(modPath, isZip, yName);
					const metadata = parseEverestYaml(content, entry);
					mods.push({ fileName: entry, isZip, modPath, metadata, name });
					break;
				} catch { /* next yaml name */ }
			}
		}
		return mods;
	}

	/** Full scan: detect collab → scan collab structure or flat campaigns */
	public async ScanMod(modInfo: EverestModInfo): Promise<ModScanResult> {
		const result: ModScanResult = { info: modInfo };
		const collabId = await this.collabUtils2.detectCollabId(modInfo);

		if (collabId) {
			result.collabId = collabId;
			result.lazyLoadingCfg = await this.collabUtils2.readLazyLoadingConfig(modInfo);

			const dialog = await this.dialogReader.readDialog(modInfo);
			const { lobbies, gyms, prologue } = await this.collabUtils2.scanCollab(
				modInfo,
				collabId,
				dialog,
				this.buildMap.bind(this),
			);
			result.lobbies = lobbies;
			result.gyms = gyms;
			result.prologue = prologue;

			modInfo.metadata = {
				...modInfo.metadata,
				isLobby: true,
				lobbyChapters: lobbies.map(l => ({
					lobbyId: l.lobbyId,
					lobbyLevels: l.maps.map(m => ({ chapterId: m.sid })),
				})),
			};
		} else {
			result.campaigns = await this.scanFlatCampaigns(modInfo);

			const chapters: ModChapter[] = [];
			for (const c of result.campaigns) {
				for (const m of c.maps) chapters.push({ chapterId: m.sid });
			}
			modInfo.metadata = {
				...modInfo.metadata,
				isLobby: false,
				chapters,
			};
		}

		return result;
	}

	// ── Non-Collab: Flat Campaign Scan ──
	// Maps/<Author>/<Campaign>/<Chapter>.bin  — one level of folders

	private async scanFlatCampaigns(modInfo: EverestModInfo): Promise<DiscoveredCampaign[]> {
		const binFiles = await this.walkModDir(modInfo.modPath, modInfo.isZip, 'Maps');
		const bins = binFiles.filter(f => f.toLowerCase().endsWith('.bin'));

		const dialog = await this.dialogReader.readDialog(modInfo);
		const campaignMap = new Map<string, DiscoveredMap[]>();

		for (const binPath of bins) {
			const sid = deriveSid(binPath);
			if (!sid) continue;
			const parts = sid.split('/');
			if (parts.length < 3) continue;

			const campaignId = parts.slice(0, -1).join('/');
			const maps = campaignMap.get(campaignId) ?? [];
			maps.push(await this.buildMap(modInfo, binPath, sid, dialog));
			campaignMap.set(campaignId, maps);
		}

		return Array.from(campaignMap.entries()).map(([campaignNameId, maps]) => ({ campaignNameId, maps }));
	}

	// ── Map Builder ──

	private async buildMap(
		modInfo: EverestModInfo,
		binPath: string,
		sid: string,
		dialog: Map<string, string>,
	): Promise<DiscoveredMap> {
		const map: DiscoveredMap = {
			sid,
			side: detectMapSide(sid),
			baseSid: baseSid(sid),
			binFileName: binPath.split('/').pop() ?? '',
			binPath,
			meta: await this.tryReadMeta<MapMetaYaml>(modInfo, binPath, '.meta.yaml'),
			altSidesHelperMeta: await this.tryReadMeta(modInfo, binPath, ALT_SIDES_META_EXT),
		};

		const dk = sidToDialogKey(sid);
		if (dialog.has(dk)) (map as Record<string, unknown>).name = dialog.get(dk);

		return map;
	}
}
