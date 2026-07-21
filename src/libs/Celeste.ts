// UNIVERSAL COMPATIBILITY
import { inject, injectable } from 'tsyringe';
import { IFileSystem_Token, IOs_Token } from '../interfaces/DependencyInjectionTokens';
import type { IFileSystem } from '../interfaces/IFileSystem';
import type { IOS } from '../interfaces/IOs';

export interface CelesteInstallation {
	foundPath: string;
	installationType: 'steam' | 'epicgames';
}

@injectable()
export default class Celeste {
	private pathCache: Promise<CelesteInstallation | null> | null = null;

	constructor(
		@inject(IOs_Token) private os: IOS,
		@inject(IFileSystem_Token) private fs: IFileSystem,
	) {}

	public GetInstallationPath(): Promise<CelesteInstallation | null> {
		if (!this.pathCache) {
			this.pathCache = this.findPath();
		}
		return this.pathCache;
	}

	private async findPath(): Promise<CelesteInstallation | null> {
		const osName = this.os.getCurrentOS();
		const targets: { path: string; type: 'steam' | 'epicgames' }[] = [];

		try {
			if (osName === 'windows') {
				targets.push(
					{ path: 'C:/Program Files (x86)/Steam/steamapps/common/Celeste', type: 'steam' },
					{ path: 'C:/Program Files/Steam/steamapps/common/Celeste', type: 'steam' },
					{ path: 'C:/Program Files/Epic Games/Celeste', type: 'epicgames' },
				);
			} else {
				const home = await this.os.getPath('home');
				if (osName === 'macos') {
					targets.push(
						{ path: `${home}/Library/Application Support/Steam/steamapps/common/Celeste`, type: 'steam' },
						{ path: `${home}/Library/Application Support/Steam/steamapps/common/Celeste/Celeste.app/Contents/Resources`, type: 'steam' },
					);
				} else {
					targets.push(
						{ path: `${home}/.local/share/Steam/steamapps/common/Celeste`, type: 'steam' },
						{ path: `${home}/.steam/steam/steamapps/common/Celeste`, type: 'steam' },
					);
				}
			}
		} catch (e) {
			console.error('OS path fetch fail:', e);
		}

		for (const { path, type } of targets) {
			for (const exe of ['Celeste.exe', 'Celeste', 'Celeste.app']) {
				if (await this.fs.exists(`${path}/${exe}`)) {
					return { foundPath: path, installationType: type };
				}
			}
		}

		return null;
	}
}
