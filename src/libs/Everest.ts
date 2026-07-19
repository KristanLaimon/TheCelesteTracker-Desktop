// biome-ignore-all lint/style/useImportType: DI Needed
import * as yaml from 'js-yaml';
import { injectable } from 'tsyringe';
import Zip_Go from '../../src-utils/Zip_Go';
import Celeste from './Celeste';
import { Log_Error } from './Logger';
import { NeutralinoFileSystem } from './NeutralinoFileSystem';

export type ModMetadata = { name: string; version: string; dependencies: ModDependency[] };
export type ModDependency = Omit<ModMetadata, 'dependencies'>;
export type EverestModInfo = { name: string; isZip: boolean; metadata: ModMetadata[] };

interface RawMeta {
	Name?: string;
	name?: string;
	Version?: string | number;
	version?: string | number;
	Dependencies?: RawMeta[];
	dependencies?: RawMeta[];
	[key: string]: unknown;
}

// ponytail: array/object normalization combined. any cast drops verbose raw types.
function parseEverestYaml(content: string, fileName: string): ModMetadata[] {
	try {
		const parsed = yaml.load(content.replace(/^\uFEFF/, '')) as RawMeta | RawMeta[] | null | undefined;
		const items = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

		return items.map((item) => ({
			...item,
			name: item.Name || item.name || '',
			version: String(item.Version ?? item.version ?? ''),
			dependencies: (item.Dependencies || item.dependencies || []).map((d) => ({
				name: d.Name || d.name || '',
				version: String(d.Version ?? d.version ?? ''),
			})),
		}));
	} catch (err) {
		console.error(`Yaml parse fail ${fileName}:`, err);
		return [];
	}
}

@injectable()
export default class Everest {
	constructor(
		private celesteDep: Celeste,
		private zip: Zip_Go,
		private fs: NeutralinoFileSystem,
	) {}

	public async GetInstallationPath(): Promise<string | null> {
		const install = await this.celesteDep.GetInstallationPath();
		return install ? `${install.foundPath}/Mods` : null;
	}

	public async GetModsInstalled(opts?: { modsCountScanningLimit?: number }): Promise<EverestModInfo[]> {
		const modsPath = await this.GetInstallationPath();
		if (!modsPath || !(await this.fs.exists(modsPath))) return [];

		let entries = await this.fs.readDirectory(modsPath);
		if (opts?.modsCountScanningLimit && opts.modsCountScanningLimit > 0) {
			entries = entries.slice(0, opts.modsCountScanningLimit);
		}
		const mods: EverestModInfo[] = [];
		const yamlNames = ['everest.yaml', 'everest.yml', 'Everest.yaml', 'Everest.yml'];

		for (const { entry, type } of entries) {
			// Omits Everest "cache" with some weird ymls there.
			if (type === 'DIRECTORY' && entry.toLowerCase().includes('cache')) {
				continue;
			}

			const isZip = type === 'FILE' && entry.toLowerCase().endsWith('.zip');
			if (type !== 'DIRECTORY' && !isZip) continue;

			for (const yName of yamlNames) {
				try {
					// ponytail: unified zip and dir read flow.
					const content = isZip ? await this.zip.readTextFile(`${modsPath}/${entry}`, yName) : await this.fs.readFile(`${modsPath}/${entry}/${yName}`);

					mods.push({ name: entry, isZip, metadata: parseEverestYaml(content, entry) });
					break;
				} catch (e: unknown) {
					Log_Error('Everest:', 'There was an error when trying to read from mod content', e);
					// ponytail: fs/zip throw if yaml missing. silent loop next.
				}
			}
		}
		return mods;
	}
}
