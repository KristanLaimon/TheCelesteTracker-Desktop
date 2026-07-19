// biome-ignore-all lint/style/useImportType: DI Needed
import { inject, injectable } from 'tsyringe';
import { IFileSystem_Token } from '../interfaces/DependencyInjectionTokens';
import type { IFileSystem } from '../interfaces/IFileSystem';
import Everest from './Everest';

interface NeutralinoWindow {
	NL_OS?: string;
	Neutralino: {
		os: {
			getPath: (name: string) => Promise<string>;
		};
	};
}

@injectable()
export default class Olympus {
	constructor(
		private everestDep: Everest,
		@inject(IFileSystem_Token) private fs: IFileSystem,
	) {
		// Suppress unused warning and verify everest dependency is registered
		void this.everestDep;
	}

	public async IsInstalled(): Promise<boolean> {
		const installs = await this.GetInstallations();
		return installs.length > 0;
	}

	public async GetInstallations(): Promise<string[]> {
		const win = typeof window !== 'undefined' ? (window as unknown as NeutralinoWindow) : undefined;
		const osName = win?.NL_OS;
		let configPath = '';

		try {
			if (osName === 'Windows') {
				const appData = await win?.Neutralino.os.getPath('data');
				if (appData) {
					configPath = `${appData}/Olympus/config.json`;
				}
			} else if (osName === 'Darwin') {
				const home = await win?.Neutralino.os.getPath('home');
				if (home) {
					configPath = `${home}/Library/Application Support/Olympus/config.json`;
				}
			} else {
				const home = await win?.Neutralino.os.getPath('home');
				if (home) {
					configPath = `${home}/.config/Olympus/config.json`;
				}
			}
		} catch (err) {
			console.error('Failed to resolve Olympus config path:', err);
		}

		if (!configPath) {
			return [];
		}

		try {
			const exists = await this.fs.exists(configPath);
			if (exists) {
				const content = await this.fs.readFile(configPath);
				const configObj = JSON.parse(content) as { installs?: (string | { path?: string })[] };
				const paths: string[] = [];
				if (configObj && Array.isArray(configObj.installs)) {
					for (const inst of configObj.installs) {
						let pathVal = '';
						if (typeof inst === 'string') {
							pathVal = inst;
						} else if (inst && typeof inst === 'object' && typeof inst.path === 'string') {
							pathVal = inst.path;
						}
						if (pathVal) {
							paths.push(pathVal.replace(/\\/g, '/'));
						}
					}
				}
				return paths;
			}
		} catch (err) {
			console.error('Failed to read Olympus installs:', err);
		}

		return [];
	}
}
