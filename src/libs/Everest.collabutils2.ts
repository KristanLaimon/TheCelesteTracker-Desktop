import * as yaml from 'js-yaml';
import { inject, injectable } from 'tsyringe';
import Zip_Go from '../../src-utils/Zip_Go';
import { IFileSystem_Token } from '../interfaces/DependencyInjectionTokens';
import type { IFileSystem, DirectoryEntry } from '../interfaces/IFileSystem';
import type { EverestModInfo, DiscoveredMap, DiscoveredLobby, MapMetaYaml } from './Everest';

export type CollabUtils2LazyLoadingYaml = {
	enable: boolean;
	excludedPrefixes?: { gui?: string[]; gameplay?: string[]; [key: string]: unknown };
	[key: string]: unknown;
};

function deriveSid(binPath: string): string | undefined {
	const normalized = binPath.replace(/\\/g, '/');
	if (!normalized.startsWith('Maps/')) return undefined;
	return normalized.replace(/\.bin$/i, '').slice('Maps/'.length);
}

@injectable()
export class CollabUtils2Scanner {
	constructor(
		@inject(IFileSystem_Token) private fs: IFileSystem,
		@inject(Zip_Go) private zip: Zip_Go,
	) {}

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

	async detectCollabId(modInfo: EverestModInfo): Promise<string | undefined> {
		const names = ['CollabUtils2CollabID.txt', 'collabutils2collabid.txt'];
		for (const name of names) {
			try {
				return (await this.readModFile(modInfo.modPath, modInfo.isZip, name)).trim();
			} catch {
				/* try next */
			}
		}
		return undefined;
	}

	async readLazyLoadingConfig(
		modInfo: EverestModInfo,
	): Promise<CollabUtils2LazyLoadingYaml | undefined> {
		try {
			const content = await this.readModFile(
				modInfo.modPath,
				modInfo.isZip,
				'CollabUtils2LazyLoading.yaml',
			);
			const cleaned = content.replace(/^\uFEFF/, '');
			return (yaml.load(cleaned) as CollabUtils2LazyLoadingYaml | null | undefined) ?? undefined;
		} catch {
			return undefined;
		}
	}

	async scanCollab(
		modInfo: EverestModInfo,
		collabName: string,
		dialog: Map<string, string>,
		buildMap: (
			modInfo: EverestModInfo,
			binPath: string,
			sid: string,
			dialog: Map<string, string>,
		) => Promise<DiscoveredMap>,
	): Promise<{ lobbies: DiscoveredLobby[]; gyms: DiscoveredMap[]; prologue?: DiscoveredMap }> {
		const baseDir = `Maps/${collabName}`;
		const allFiles = await this.walkModDir(modInfo.modPath, modInfo.isZip, baseDir);
		const bins = allFiles.filter(f => f.toLowerCase().endsWith('.bin'));
		const lobbies: DiscoveredLobby[] = [];
		const gyms: DiscoveredMap[] = [];
		let prologue: DiscoveredMap | undefined;

		const lobbyBins = bins.filter(f => f.startsWith(`${baseDir}/0-Lobbies/`));
		const gymBins = bins.filter(f => f.startsWith(`${baseDir}/0-Gyms/`));
		const levelBins = bins.filter(f => {
			if (f.startsWith(`${baseDir}/0-`)) return false;
			const rest = f.slice((baseDir + '/').length);
			return rest.includes('/') && !rest.startsWith('0-');
		});

		for (const binPath of lobbyBins) {
			const sid = deriveSid(binPath);
			if (!sid) continue;
			const lobbyId = sid.split('/').pop()!;

			if (/^0-Prologue/i.test(lobbyId)) {
				prologue = await buildMap(modInfo, binPath, sid, dialog);
				continue;
			}

			const levels: DiscoveredMap[] = [];
			for (const lb of levelBins) {
				const lid = lb.slice((baseDir + '/').length).split('/')[0];
				if (lid === lobbyId) {
					const lsid = deriveSid(lb);
					if (lsid) levels.push(await buildMap(modInfo, lb, lsid, dialog));
				}
			}

			let meta: MapMetaYaml | undefined;
			try {
				const c = await this.readModFile(
					modInfo.modPath,
					modInfo.isZip,
					binPath.replace(/\.bin$/i, '.meta.yaml'),
				);
				meta = (yaml.load(c.replace(/^\uFEFF/, '')) as MapMetaYaml | null | undefined) ?? undefined;
			} catch {
				/* no meta */
			}

			lobbies.push({ lobbyId, maps: levels, meta });
		}

		for (const binPath of gymBins) {
			const sid = deriveSid(binPath);
			if (sid) gyms.push(await buildMap(modInfo, binPath, sid, dialog));
		}

		return { lobbies, gyms, prologue };
	}
}
