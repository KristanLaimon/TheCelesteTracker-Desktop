/**
 * @fileoverview Web Worker for parallel mod scanning.
 *
 * Runs in a separate thread via `web-worker`. Does NOT use DI — uses Node.js
 * `fs/promises` for file I/O and calls the zip utility executable directly.
 * Receives batches of mod entries from the main thread, scans them, and posts
 * results back.
 *
 * Message protocol (main → worker):
 *   { entries: {entry:string, type:string}[], modsPath: string, zipExePath: string, taskId: number }
 *
 * Message protocol (worker → main):
 *   { mods: EverestModInfo[], taskId: number }
 */

import * as fs from 'node:fs/promises';
import { execSync } from 'node:child_process';
import * as yaml from 'js-yaml';

const YAML_NAMES = ['everest.yaml', 'everest.yml', 'Everest.yaml', 'Everest.yml'];

type RawDep = { Name?: string; name?: string; Version?: string | number; version?: string | number; [key: string]: unknown };
type RawMeta = { Name?: string; name?: string; Version?: string | number; version?: string | number; DLL?: string; dll?: string; Dependencies?: RawDep[]; dependencies?: RawDep[]; OptionalDependencies?: RawDep[]; optionalDependencies?: RawDep[]; [key: string]: unknown };

type ModDependency = { name: string; version: string };
type EverestModInfo = { fileName: string; isZip: boolean; modPath: string; metadata: any; name: string };

function normalizeDep(d: RawDep): ModDependency {
	return { name: d.Name || d.name || '', version: String(d.Version ?? d.version ?? '') };
}

function parseEverestYaml(content: string, _fileName: string): any {
	try {
		const cleaned = content.replace(/^\uFEFF/, '');
		const parsed = yaml.load(cleaned) as RawMeta | RawMeta[] | null | undefined;
		if (!parsed) return { name: '', version: '', dependencies: [], isLobby: false };
		const item = Array.isArray(parsed) ? parsed[0] : parsed;
		const { Name, Version, DLL, Dependencies, OptionalDependencies, ...rest } = item;
		return {
			...rest,
			name: Name || rest.name || '',
			version: String(Version ?? rest.version ?? ''),
			dll: DLL || rest.dll || undefined,
			dependencies: (Dependencies || rest.dependencies || []).map(normalizeDep),
			optionalDependencies: (OptionalDependencies || rest.optionalDependencies || []).map(normalizeDep),
			isLobby: false,
			chapters: [],
			campaigns: [],
		};
	} catch {
		return { name: '', version: '', dependencies: [], isLobby: false, chapters: [], campaigns: [] };
	}
}

function normalizeModName(filename: string): string {
	let name = filename.replace(/\.(zip|txt)$/i, '');
	name = name.replace(/^(\d+\.)+\d+[-]+/, '');
	name = name.replace(/_/g, ' ');
	name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
	return name.trim();
}

async function readModFile(modPath: string, isZip: boolean, filePath: string, zipExePath: string): Promise<string> {
	if (isZip) {
		const cmd = `"${zipExePath}" zip read --zip "${modPath}" --file "${filePath}"`;
		const result = execSync(cmd, { encoding: 'utf-8', windowsHide: true });
		const parsed = JSON.parse(result);
		if (!parsed.success) throw new Error(parsed.error || 'Zip read failed');
		return parsed.content;
	}
	return await fs.readFile(`${modPath}/${filePath}`, 'utf-8');
}

async function scanSingleMod(
	modsPath: string, entry: string, type: string, zipExePath: string,
): Promise<EverestModInfo | null> {
	if (type === 'DIRECTORY' && entry.toLowerCase().includes('cache')) return null;
	const isZip = type === 'FILE' && entry.toLowerCase().endsWith('.zip');
	if (type !== 'DIRECTORY' && !isZip) return null;

	const modPath = `${modsPath}/${entry}`;
	const name = normalizeModName(entry);

	for (const yName of YAML_NAMES) {
		try {
			const content = await readModFile(modPath, isZip, yName, zipExePath);
			const metadata = parseEverestYaml(content, entry);

			const collabNames = ['CollabUtils2CollabID.txt', 'collabutils2collabid.txt'];
			let collabId: string | undefined;
			for (const cn of collabNames) {
				try {
					collabId = (await readModFile(modPath, isZip, cn, zipExePath)).trim();
					break;
				} catch { /* try next */ }
			}

			if (collabId) {
				metadata.isLobby = true;
				metadata.collabId = collabId;
				metadata.lobbyChapters = [];
				metadata.lobbies = [];
				metadata.gyms = [];
			}

			return { fileName: entry, isZip, modPath, metadata, name };
		} catch { /* next yaml name */ }
	}
	return null;
}

self.onmessage = async (e: MessageEvent<{ entries: { entry: string; type: string }[]; modsPath: string; zipExePath: string; taskId: number }>) => {
	const { entries, modsPath, zipExePath, taskId } = e.data;
	const results: EverestModInfo[] = [];
	for (const { entry, type } of entries) {
		const mod = await scanSingleMod(modsPath, entry, type, zipExePath);
		if (mod) results.push(mod);
	}
	self.postMessage({ mods: results, taskId });
};
