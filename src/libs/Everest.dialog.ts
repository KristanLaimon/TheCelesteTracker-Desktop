import { inject, injectable } from 'tsyringe';
import Zip_Go from '../../src-utils/Zip_Go';
import { IFileSystem_Token } from '../interfaces/DependencyInjectionTokens';
import type { IFileSystem } from '../interfaces/IFileSystem';
import type { EverestModInfo } from './Everest';

@injectable()
export class DialogReader {
	constructor(
		@inject(IFileSystem_Token) private fs: IFileSystem,
		@inject(Zip_Go) private zip: Zip_Go,
	) {}

	private async readModFile(modPath: string, isZip: boolean, filePath: string): Promise<string> {
		return isZip
			? await this.zip.readTextFile(modPath, filePath)
			: await this.fs.readFile(`${modPath}/${filePath}`);
	}

	async readDialog(modInfo: EverestModInfo, lang = 'English.txt'): Promise<Map<string, string>> {
		const map = new Map<string, string>();
		const paths = [`Dialog/${lang}`, `dialog/${lang}`];
		for (const p of paths) {
			try {
				const text = await this.readModFile(modInfo.modPath, modInfo.isZip, p);
				for (const line of text.split('\n')) {
					const eq = line.indexOf('=');
					if (eq > 0) map.set(line.slice(0, eq).trim(), line.slice(eq + 1).trim());
				}
				break;
			} catch {
				/* try next path */
			}
		}
		return map;
	}
}

export function sidToDialogKey(sid: string): string {
	return sid.replace(/[/\-+ ]/g, '_');
}
