// UNIVERSAL COMPATIBILITY
/**
 * @fileoverview Dialog file reader for Everest mods.
 *
 * Mods ship dialog translations as key=value text files under:
 *   Dialog/<lang>.txt          (English.txt, French.txt, etc.)
 *   dialog/<lang>.txt          (lowercase fallback)
 *
 * Each line of the form:
 *   some_dialog_key=A display name
 *
 * The dialog file is used to resolve human-readable names for maps
 * and other game objects from their SID-derived dialog keys.
 */

import { inject, injectable } from "tsyringe";
import Zip_Go from "../../src-utils/Zip_Go";
import { IFileSystem_Token } from "../core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../core/interfaces/IFileSystem";
import type { EverestModInfo } from "./Everest";

/**
 * Reads dialog files (`Dialog/<lang>.txt`) from a mod and returns
 * the parsed key→value mappings.
 *
 * Dialog keys follow the convention of replacing `/`, `-`, `+`, and spaces
 * in SIDs with underscores — see `sidToDialogKey`.
 */
@injectable()
export class DialogReader {
	constructor(
		@inject(IFileSystem_Token) private fs: IFileSystem,
		@inject(Zip_Go) private zip: Zip_Go,
	) {}

	private async readModFile(modPath: string, isZip: boolean, filePath: string): Promise<string> {
		return isZip ? await this.zip.readTextFile(modPath, filePath) : await this.fs.readFile(`${modPath}/${filePath}`);
	}

	/**
	 * Parse key=value text string into Map<dialogKey, displayText>.
	 */
	parseDialogContent(text: string): Map<string, string> {
		const map = new Map<string, string>();
		for (const line of text.split(/\r?\n/)) {
			const eq = line.indexOf("=");
			if (eq > 0) map.set(line.slice(0, eq).trim(), line.slice(eq + 1).trim());
		}
		return map;
	}

	/**
	 * Parse dialog files map (from batch Go scan) into Map<dialogKey, displayText>.
	 */
	parseDialogFromMap(dialogFiles?: Record<string, string>, lang = "English.txt"): Map<string, string> {
		if (!dialogFiles) return new Map();
		const targetSuffix = `/${lang.toLowerCase()}`;
		for (const [filePath, content] of Object.entries(dialogFiles)) {
			const lower = filePath.toLowerCase();
			if (lower.endsWith(targetSuffix) || lower === lang.toLowerCase()) {
				return this.parseDialogContent(content);
			}
		}
		const map = new Map<string, string>();
		for (const content of Object.values(dialogFiles)) {
			for (const [k, v] of this.parseDialogContent(content)) {
				map.set(k, v);
			}
		}
		return map;
	}

	/**
	 * Read a dialog file for the given language and return a `Map<dialogKey, displayText>`.
	 *
	 * Tries `Dialog/<lang>` first, then `dialog/<lang>` as a fallback.
	 * Each non-empty line before the first `=` is the key, after is the value (both trimmed).
	 * Lines without `=` are silently skipped.
	 *
	 * @param modInfo - The mod to read dialog from
	 * @param lang - Language file name (default `"English.txt"`)
	 */
	async readDialog(modInfo: EverestModInfo, lang = "English.txt"): Promise<Map<string, string>> {
		const map = new Map<string, string>();
		const paths = [`Dialog/${lang}`, `dialog/${lang}`];
		for (const p of paths) {
			try {
				const text = await this.readModFile(modInfo.modPath, modInfo.isZip, p);
				return this.parseDialogContent(text);
			} catch {
				/* try next path */
			}
		}
		return map;
	}
}

/**
 * Convert a Celeste SID to the dialog key convention used in `Dialog/*.txt`.
 *
 * SIDs use `/` as path separators and `-` for side suffixes (e.g. `-B`, `-C`).
 * Dialog files replace those characters with underscores.
 *
 * @example sidToDialogKey("bryse0n/berry143/berry143") → "bryse0n_berry143_berry143"
 * @example sidToDialogKey("map/foo-B") → "map_foo_B"
 */
export function sidToDialogKey(sid: string): string {
	return sid.replace(/[/\-+ ]/g, "_");
}
