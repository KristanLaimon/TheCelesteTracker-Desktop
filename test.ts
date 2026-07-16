import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import * as yaml from 'js-yaml';

const modsPath = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Celeste\\Mods';

interface ModMetadata {
	name: string;
	version: string;
	dependencies: { name: string; version: string }[];
	[key: string]: unknown;
}

interface InstalledMod {
	fileName: string;
	isZip: boolean;
	metadata: ModMetadata[];
}

interface EverestDep {
	Name?: string | number;
	Version?: string | number;
	[key: string]: unknown;
}

function parseEverestYaml(content: string, fileName: string): ModMetadata[] {
	// Strip UTF-8 Byte Order Mark (BOM) if present
	const cleanContent = content.replace(/^\uFEFF/, '');

	try {
		const parsed = yaml.load(cleanContent);
		if (Array.isArray(parsed)) {
			return parsed.map((item: Record<string, unknown>) => ({
				name: typeof item.Name === 'string' ? item.Name : '',
				version: item.Version != null ? String(item.Version) : '',
				dependencies: Array.isArray(item.Dependencies)
					? item.Dependencies.map((dep: EverestDep) => ({
							name: typeof dep.Name === 'string' ? dep.Name : '',
							version: dep.Version != null ? String(dep.Version) : '',
						}))
					: [],
				...item,
			}));
		} else if (parsed && typeof parsed === 'object') {
			// fallback if it's a single object instead of an array
			const item = parsed as Record<string, unknown>;
			return [
				{
					name: typeof item.Name === 'string' ? item.Name : '',
					version: item.Version != null ? String(item.Version) : '',
					dependencies: Array.isArray(item.Dependencies)
						? item.Dependencies.map((dep: EverestDep) => ({
								name: typeof dep.Name === 'string' ? dep.Name : '',
								version: dep.Version != null ? String(dep.Version) : '',
							}))
						: [],
					...item,
				},
			];
		}
	} catch (err) {
		console.error(`Error parsing everest.yaml in ${fileName}:`, err);
	}
	return [];
}

function scanMods(modsDir: string): InstalledMod[] {
	const installedMods: InstalledMod[] = [];
	if (!fs.existsSync(modsDir)) {
		console.error(`Mods directory not found: ${modsDir}`);
		return [];
	}

	const files = fs.readdirSync(modsDir);
	for (const file of files) {
		const fullPath = path.join(modsDir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			// It's a directory mod
			let yamlContent = '';
			let foundYaml = false;
			for (const yamlFile of ['everest.yaml', 'everest.yml']) {
				const yamlPath = path.join(fullPath, yamlFile);
				if (fs.existsSync(yamlPath)) {
					yamlContent = fs.readFileSync(yamlPath, 'utf8');
					foundYaml = true;
					break;
				}
			}

			if (foundYaml) {
				const metadata = parseEverestYaml(yamlContent, file);
				installedMods.push({
					fileName: file,
					isZip: false,
					metadata,
				});
			}
		} else if (file.endsWith('.zip')) {
			// It's a zip mod
			try {
				const zip = new AdmZip(fullPath);
				const zipEntries = zip.getEntries();
				const yamlEntry = zipEntries.find((entry) => entry.entryName.toLowerCase() === 'everest.yaml' || entry.entryName.toLowerCase() === 'everest.yml');

				if (yamlEntry) {
					const yamlContent = yamlEntry.getData().toString('utf8');
					const metadata = parseEverestYaml(yamlContent, file);
					installedMods.push({
						fileName: file,
						isZip: true,
						metadata,
					});
				}
			} catch (err) {
				console.error(`Error reading zip file ${file}:`, err);
			}
		}
	}

	return installedMods;
}

console.log('Scanning mods...');
const mods = scanMods(modsPath);
console.log(`\nScan completed! Found ${mods.length} mods with valid metadata.`);

const parsedWithMultiple = mods.filter((m) => m.metadata.length > 1);
if (parsedWithMultiple.length > 0) {
	console.log(`\nNote: Found ${parsedWithMultiple.length} mods with multiple modules declared in everest.yaml.`);
}

console.log('\nSummary of first 10 mods found:');
for (const mod of mods.slice(0, 10)) {
	const names = mod.metadata.map((m) => `${m.name} (v${m.version})`).join(', ');
	console.log(`- [${mod.isZip ? 'ZIP' : 'DIR'}] ${mod.fileName} -> ID/Name(s): ${names || 'None'}`);
}
