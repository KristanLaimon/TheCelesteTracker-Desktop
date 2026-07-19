// biome-ignore-all lint/style/useImportType: DI Needed

// NodeOS.ts
import type { ChildProcess } from 'node:child_process';
import { exec, spawn } from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';
import { injectable } from 'tsyringe';
// Type-only imports
import type {
	Envs,
	ExecCommandOptions,
	ExecCommandResult,
	FolderDialogOptions,
	Icon,
	MessageBoxChoice,
	NeutralinoKnownPath,
	OpenDialogOptions,
	SaveDialogOptions,
	SpawnedProcess,
	SpawnedProcessAction,
	SpawnedProcessOptions,
	TrayOptions,
} from '../src/interfaces/IOs';
// Value import for the abstract class
import { IOS } from '../src/interfaces/IOs';

@injectable()
export default class NodeJsOS implements IOS {
	// --- MOCK STORAGE PROPERTIES ---
	public mockTrayState: TrayOptions | null = null;
	public mockNotifications: Array<{ title: string; content: string; icon?: Icon }> = [];
	public mockMessageBoxes: Array<{ title: string; content: string; choice?: MessageBoxChoice; icon?: Icon }> = [];
	public mockOpenDialogCalls: Array<{ title?: string; options?: OpenDialogOptions }> = [];
	public mockSaveDialogCalls: Array<{ title?: string; options?: SaveDialogOptions }> = [];
	public mockFolderDialogCalls: Array<{ title?: string; options?: FolderDialogOptions }> = [];
	public mockTrashCalls: string[] = [];

	// --- INTERNAL PROCESS TRACKING ---
	private nextProcessId = 1;
	private activeProcesses = new Map<number, ChildProcess>();

	public async execCommand(command: string, options?: ExecCommandOptions): Promise<ExecCommandResult> {
		return new Promise((resolve, _) => {
			const child = exec(command, { env: { ...process.env, ...options?.envs } }, (error, stdout, stderr) => {
				resolve({
					pid: child.pid ?? 0,
					stdOut: stdout,
					stdErr: stderr,
					exitCode: Number(error?.code) ?? 0,
				});
			});

			if (options?.stdIn && child.stdin) {
				child.stdin.write(options.stdIn);
				child.stdin.end();
			}
		});
	}

	public async spawnProcess(command: string, options?: SpawnedProcessOptions): Promise<SpawnedProcess> {
		const args = command.split(' ');
		const cmd = args.shift() || '';

		const child = spawn(cmd, args, {
			env: { ...process.env, ...options?.envs },
			shell: true,
		});

		const id = this.nextProcessId++;
		this.activeProcesses.set(id, child);

		child.on('exit', () => {
			this.activeProcesses.delete(id);
		});

		return {
			id,
			pid: child.pid ?? 0,
		};
	}

	public async updateSpawnedProcess(id: number, action: SpawnedProcessAction, data?: string): Promise<void> {
		const child = this.activeProcesses.get(id);
		if (!child) throw new Error(`Process with id ${id} not found or already exited`);

		switch (action) {
			case 'stdIn':
				if (data) child.stdin?.write(data);
				break;
			case 'stdInEnd':
				child.stdin?.end();
				break;
			case 'exit':
				child.kill();
				this.activeProcesses.delete(id);
				break;
		}
	}

	public async getSpawnedProcesses(): Promise<SpawnedProcess[]> {
		return Array.from(this.activeProcesses.entries()).map(([id, child]) => ({
			id,
			pid: child.pid ?? 0,
		}));
	}

	public async getEnv(key: string): Promise<string> {
		return process.env[key] ?? '';
	}

	public async getEnvs(): Promise<Envs> {
		return process.env as Envs;
	}

	public async getPath(name: NeutralinoKnownPath): Promise<string> {
		const home = os.homedir();
		switch (name) {
			case 'home':
				return home;
			case 'desktop':
				return path.join(home, 'Desktop');
			case 'downloads':
				return path.join(home, 'Downloads');
			case 'music':
				return path.join(home, 'Music');
			case 'pictures':
				return path.join(home, 'Pictures');
			case 'videos':
				return path.join(home, 'Videos');
			case 'temp':
				return os.tmpdir();
			default:
				// Fallback for neutralino-specific paths like saveGames1
				return path.join(home, name);
		}
	}

	public async open(url: string): Promise<void> {
		// Windows specific 'start' command, matching your environment
		return new Promise((resolve) => {
			exec(`start "" "${url}"`, () => resolve());
		});
	}

	// --- MOCKED UI / SYSTEM METHODS ---

	public async setTray(options: TrayOptions): Promise<void> {
		this.mockTrayState = options;
	}

	public async showNotification(title: string, content: string, icon?: Icon): Promise<void> {
		this.mockNotifications.push({ title, content, icon });
	}

	public async showMessageBox(title: string, content: string, choice?: MessageBoxChoice, icon?: Icon): Promise<string> {
		this.mockMessageBoxes.push({ title, content, choice, icon });
		return 'OK'; // Default mock response
	}

	public async showOpenDialog(title?: string, options?: OpenDialogOptions): Promise<string[]> {
		this.mockOpenDialogCalls.push({ title, options });
		return []; // Return empty selection
	}

	public async showSaveDialog(title?: string, options?: SaveDialogOptions): Promise<string> {
		this.mockSaveDialogCalls.push({ title, options });
		return ''; // Return empty selection
	}

	public async showFolderDialog(title?: string, options?: FolderDialogOptions): Promise<string> {
		this.mockFolderDialogCalls.push({ title, options });
		return ''; // Return empty selection
	}

	public async trashItem(targetPath: string): Promise<string> {
		this.mockTrashCalls.push(targetPath);
		return '';
	}
}
