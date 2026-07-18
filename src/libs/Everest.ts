// biome-ignore-all lint/style/useImportType: DI Needed
import * as yaml from 'js-yaml';
import { injectable } from 'tsyringe';
import { Zip_Go } from '../../src-utils/Zip';
import Celeste from './Celeste';

export interface ModDependency {
	name: string;
	version: string;
}

export interface ModMetadata {
	name: string;
	version: string;
	dependencies: ModDependency[];
	[key: string]: unknown;
}

export interface EverestModInfo {
	fileName: string;
	isZip: boolean;
	metadata: ModMetadata[];
}

interface RawDependency {
	Name?: string;
	name?: string;
	Version?: string | number;
	version?: string | number;
}

interface RawMetadata {
	Name?: string;
	name?: string;
	Version?: string | number;
	version?: string | number;
	Dependencies?: RawDependency[];
	dependencies?: RawDependency[];
	[key: string]: unknown;
}

function parseEverestYaml(content: string, fileName: string): ModMetadata[] {
	const cleanContent = content.replace(/^\uFEFF/, '');
	try {
		const parsed = yaml.load(cleanContent);
		if (Array.isArray(parsed)) {
			return (parsed as RawMetadata[]).map((item) => {
				const rawDeps = (item.Dependencies || item.dependencies) as RawDependency[] | undefined;
				return {
					...item,
					name: item.Name || item.name || '',
					version: item.Version || item.version ? String(item.Version || item.version) : '',
					dependencies: Array.isArray(rawDeps)
						? rawDeps.map((dep) => ({
								name: dep.Name || dep.name || '',
								version: dep.Version || dep.version ? String(dep.Version || dep.version) : '',
							}))
						: [],
				};
			});
		}
		if (parsed && typeof parsed === 'object') {
			const item = parsed as RawMetadata;
			const rawDeps = (item.Dependencies || item.dependencies) as RawDependency[] | undefined;
			return [
				{
					...item,
					name: item.Name || item.name || '',
					version: item.Version || item.version ? String(item.Version || item.version) : '',
					dependencies: Array.isArray(rawDeps)
						? rawDeps.map((dep) => ({
								name: dep.Name || dep.name || '',
								version: dep.Version || dep.version ? String(dep.Version || dep.version) : '',
							}))
						: [],
				},
			];
		}
	} catch (err) {
		console.error(`Error parsing everest.yaml in ${fileName}:`, err);
	}
	return [];
}

@injectable()
export default class Everest {
	constructor(
		private celesteDep: Celeste,
		private utilsExt: Zip_Go,
	) {}

	public GetModsFolderPath(): string {
		const gamePath = this.celesteDep.GetGamePath();
		return gamePath ? `${gamePath}/Mods` : '';
	}

	private async readZipTextFile(zipPath: string, filePath: string): Promise<string> {
		return this.utilsExt.readTextFile(zipPath, filePath);
	}

	public async GetAllModsInfo(): Promise<EverestModInfo[]> {
		const modsPath = this.GetModsFolderPath();
		if (!modsPath) {
			return [];
		}

		const exists = await this.celesteDep.IsInstalled();
		if (!exists) {
			return [];
		}

		try {
			const fs = this.celesteDep.fs;
			const dirExists = await fs.exists(modsPath);
			if (!dirExists) {
				return [];
			}
			const entries = await fs.readDirectory(modsPath);
			const installedMods: EverestModInfo[] = [];

			for (const entry of entries) {
				if (entry.type === 'DIRECTORY') {
					let yamlContent = '';
					let foundYaml = false;
					for (const yName of ['everest.yaml', 'everest.yml', 'Everest.yaml', 'Everest.yml']) {
						const yamlPath = `${modsPath}/${entry.entry}/${yName}`;
						const yamlExists = await fs.exists(yamlPath);
						if (yamlExists) {
							yamlContent = await fs.readFile(yamlPath);
							foundYaml = true;
							break;
						}
					}

					if (foundYaml) {
						const metadata = parseEverestYaml(yamlContent, entry.entry);
						installedMods.push({
							fileName: entry.entry,
							isZip: false,
							metadata,
						});
					}
				} else if (entry.type === 'FILE' && entry.entry.toLowerCase().endsWith('.zip')) {
					let yamlContent = '';
					let foundYaml = false;
					for (const yName of ['everest.yaml', 'everest.yml', 'Everest.yaml', 'Everest.yml']) {
						try {
							yamlContent = await this.readZipTextFile(`${modsPath}/${entry.entry}`, yName);
							foundYaml = true;
							break;
						} catch {
							// Try next name
						}
					}

					if (foundYaml) {
						const metadata = parseEverestYaml(yamlContent, entry.entry);
						installedMods.push({
							fileName: entry.entry,
							isZip: true,
							metadata,
						});
					}
				}
			}

			return installedMods;
		} catch (err) {
			console.error('Error scanning mods:', err);
			return [];
		}
	}

	public async IsInstalled(): Promise<boolean> {
		return this.celesteDep.IsInstalled();
	}
}
