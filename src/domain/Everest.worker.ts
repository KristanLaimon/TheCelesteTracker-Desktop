// UNIVERSAL COMPATIBILITY
/**
 * @fileoverview Web Worker for parallel mod metadata parsing.
 *
 * Pure computation — receives pre-read file content from the main thread
 * and parses mod metadata. No I/O, works in any environment
 * (browser, Neutralino, Bun, Node.js).
 *
 * Message protocol (main -> worker):
 *   { entries: { entry: string, type: string, modPath: string, yamlContent: string, collabContent?: string }[], taskId: number }
 *
 * Message protocol (worker -> main):
 *   { mods: EverestModInfo[], taskId: number }
 */

import * as yaml from "js-yaml";

type RawDep = { Name?: string; name?: string; Version?: string | number; version?: string | number; [key: string]: unknown };
type RawMeta = {
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
};

type ModDependency = { name: string; version: string };
type EverestModInfo = { fileName: string; isZip: boolean; modPath: string; metadata: any; humanName: string };

function normalizeDep(d: RawDep): ModDependency {
	return { name: d.Name || d.name || "", version: String(d.Version ?? d.version ?? "") };
}

function parseEverestYaml(content: string, _fileName: string): any {
	try {
		const cleaned = content.replace(/^\uFEFF/, "");
		const parsed = yaml.load(cleaned) as RawMeta | RawMeta[] | null | undefined;
		if (!parsed) return { name: "", version: "", dependencies: [], isMapMod: false, isLobby: false };
		const item = Array.isArray(parsed) ? parsed[0] : parsed;
		const { Name, Version, DLL, Dependencies, OptionalDependencies, ...rest } = item;
		return {
			...rest,
			name: Name || rest.name || "",
			version: String(Version ?? rest.version ?? ""),
			dll: DLL || rest.dll || undefined,
			dependencies: (Dependencies || rest.dependencies || []).map(normalizeDep),
			optionalDependencies: (OptionalDependencies || rest.optionalDependencies || []).map(normalizeDep),
			isMapMod: false,
			isLobby: false,
		};
	} catch {
		return { name: "", version: "", dependencies: [], isMapMod: false, isLobby: false };
	}
}

function normalizeModName(filename: string): string {
	let name = filename.replace(/\.(zip|txt)$/i, "");
	name = name.replace(/^(\d+\.)+\d+[-]+/, "");
	name = name.replace(/_/g, " ");
	name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
	return name.trim();
}

self.onmessage = (
	e: MessageEvent<{
		entries: { entry: string; type: string; modPath: string; yamlContent: string; collabContent?: string }[];
		taskId: number;
	}>,
) => {
	const { entries, taskId } = e.data;
	const results: EverestModInfo[] = [];
	for (const { entry, type, modPath, yamlContent, collabContent } of entries) {
		const metadata = parseEverestYaml(yamlContent, entry);
		const name = normalizeModName(entry);
		const isZip = type === "FILE";

		if (collabContent) {
			metadata.isMapMod = true;
			metadata.isLobby = true;
			metadata.collabId = collabContent.trim();
			metadata.lobbyChapters = [];
			metadata.lobbies = [];
			metadata.gyms = [];
		}

		results.push({ fileName: entry, isZip, modPath, metadata, humanName: name });
	}
	self.postMessage({ mods: results, taskId });
};
