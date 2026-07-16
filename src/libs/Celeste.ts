// biome-ignore-all lint/style/useImportType: DI Needed
import { injectable } from 'tsyringe';
import { NeutralinoFileSystem } from './NeutralinoFileSystem';

interface NeutralinoWindow {
	NL_OS?: string;
	Neutralino: {
		os: {
			getPath: (name: string) => Promise<string>;
		};
	};
}

@injectable()
export default class Celeste {
	private gamePath: string = '';
	private isLocating: Promise<boolean> | null = null;

	constructor(public fs: NeutralinoFileSystem) {}

	private async isValidCelestePath(p: string): Promise<boolean> {
		const checks = ['Celeste.exe', 'Celeste', 'Celeste.bin.x86_64', 'Celeste.app', 'Mods'];
		for (const check of checks) {
			const exists = await this.fs.exists(`${p}/${check}`);
			if (exists) {
				return true;
			}
		}
		return false;
	}

	public async locateCelestePaths(): Promise<string[]> {
		const candidates: string[] = [];
		const win = typeof window !== 'undefined' ? (window as unknown as NeutralinoWindow) : undefined;
		const osName = win?.NL_OS;

		try {
			if (osName === 'Windows') {
				const appData = await win?.Neutralino.os.getPath('data');
				if (appData) {
					candidates.push(`${appData}/Olympus/config.json`);
				}
				candidates.push('C:/Program Files (x86)/Steam/steamapps/common/Celeste');
				candidates.push('C:/Program Files/Steam/steamapps/common/Celeste');
				candidates.push('C:/Program Files/Epic Games/Celeste');
			} else if (osName === 'Darwin') {
				const home = await win?.Neutralino.os.getPath('home');
				if (home) {
					candidates.push(`${home}/Library/Application Support/Olympus/config.json`);
					candidates.push(`${home}/Library/Application Support/Steam/steamapps/common/Celeste`);
					candidates.push(`${home}/Library/Application Support/Steam/steamapps/common/Celeste/Celeste.app/Contents/Resources`);
				}
			} else {
				const home = await win?.Neutralino.os.getPath('home');
				if (home) {
					candidates.push(`${home}/.config/Olympus/config.json`);
					candidates.push(`${home}/.local/share/Steam/steamapps/common/Celeste`);
					candidates.push(`${home}/.steam/steam/steamapps/common/Celeste`);
					candidates.push(`${home}/.steam/root/steamapps/common/Celeste`);
				}
			}
		} catch (err) {
			console.error('Failed to get system paths:', err);
		}

		const validPaths: string[] = [];
		const seen = new Set<string>();

		const addPath = async (p: string) => {
			if (!p) return;
			let normalized = p.replace(/\\/g, '/');
			while (normalized.endsWith('/')) {
				normalized = normalized.slice(0, -1);
			}
			if (seen.has(normalized)) return;
			seen.add(normalized);

			const valid = await this.isValidCelestePath(normalized);
			if (valid) {
				validPaths.push(normalized);
			}
		};

		for (const candidate of candidates) {
			if (candidate.endsWith('config.json')) {
				try {
					const configExists = await this.fs.exists(candidate);
					if (configExists) {
						const content = await this.fs.readFile(candidate);
						const configObj = JSON.parse(content) as { installs?: (string | { path?: string })[] };
						if (configObj && Array.isArray(configObj.installs)) {
							for (const inst of configObj.installs) {
								if (typeof inst === 'string') {
									await addPath(inst);
								} else if (inst && typeof inst === 'object' && typeof inst.path === 'string') {
									await addPath(inst.path);
								}
							}
						}
					}
				} catch (err) {
					console.error(`Failed to read/parse Olympus config at ${candidate}:`, err);
				}
			} else {
				await addPath(candidate);
			}
		}

		return validPaths;
	}

	public async IsInstalled(): Promise<boolean> {
		if (this.gamePath) {
			const exists = await this.isValidCelestePath(this.gamePath);
			if (exists) {
				return true;
			}
		}
		if (this.isLocating) {
			return this.isLocating;
		}

		this.isLocating = this.locateCelestePaths()
			.then((paths) => {
				if (paths.length > 0) {
					this.gamePath = paths[0];
					return true;
				}
				return false;
			})
			.finally(() => {
				this.isLocating = null;
			});

		return this.isLocating;
	}

	public GetGamePath(): string {
		if (this.gamePath) {
			return this.gamePath;
		}
		const win = typeof window !== 'undefined' ? (window as unknown as NeutralinoWindow) : undefined;
		const osName = win?.NL_OS;
		if (osName === 'Windows') {
			return 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Celeste';
		}
		if (osName === 'Darwin') {
			return '~/Library/Application Support/Steam/steamapps/common/Celeste';
		}
		return '~/.local/share/Steam/steamapps/common/Celeste';
	}
}
