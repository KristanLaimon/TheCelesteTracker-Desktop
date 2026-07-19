// biome-ignore-all lint/style/useImportType: DI Needed
import type {
	Envs,
	ExecCommandResult,
	FolderDialogOptions,
	Icon,
	KnownPath,
	MessageBoxChoice,
	ExecCommandOptions as NeutralinoExecCommandOptions,
	OpenDialogOptions,
	SaveDialogOptions,
	SpawnedProcess,
	SpawnedProcessOptions,
	TrayOptions,
} from '@neutralinojs/lib';
import { os } from '@neutralinojs/lib';
import { injectable } from 'tsyringe';
import { IOS } from '../interfaces/IOs';
import { OperatingSystem } from './NeutralinoFileSystem';

export interface ExecCommandOptions extends NeutralinoExecCommandOptions {
	envs?: Record<string, string>;
}

export type NeutralinoKnownPath = KnownPath | 'home' | 'desktop' | 'saveGames1' | 'saveGames2';

export type SpawnedProcessAction = 'stdIn' | 'stdInEnd' | 'exit';

/**
 * NeutralinoOS is a robust, type-safe 1:1 wrapper around the Neutralino.os API.
 * Exposes methods related to the user's operating system (commands execution, dialogs, paths, environment, etc).
 */
@injectable()
export class NeutralinoOS extends IOS {
	public getCurrentOS(): 'windows' | 'macos' | 'freebsd' | 'linux' | 'unknown' {
		switch (window.NL_OS) {
			case OperatingSystem.Windows:
				return 'windows';
			case OperatingSystem.Darwin:
				return 'macos';
			case OperatingSystem.FreeBSD:
				return 'freebsd';
			case OperatingSystem.Linux:
				return 'linux';
			default:
				return 'unknown';
		}
	}
	/**
	 * Executes a command and returns the output.
	 * @param command The command that is to be executed.
	 * @param options Execution configurations.
	 */
	public async execCommand(command: string, options?: ExecCommandOptions): Promise<ExecCommandResult> {
		return os.execCommand(command, options);
	}

	/**
	 * Spawns a process based on a command in background and lets developers control it.
	 * @param command The command that is to be executed in a new process.
	 * @param options Process spawning options.
	 */
	public async spawnProcess(command: string, options?: SpawnedProcessOptions): Promise<SpawnedProcess> {
		return os.spawnProcess(command, options);
	}

	/**
	 * Updates a spawned process based on a provided action and data.
	 * Throws NE_OS_UNLTOUP if the process cannot be updated.
	 * @param id Neutralino-scoped process identifier.
	 * @param action An action to take (stdIn, stdInEnd, exit).
	 * @param data Additional data for the action.
	 */
	public async updateSpawnedProcess(id: number, action: SpawnedProcessAction, data?: string): Promise<void> {
		return os.updateSpawnedProcess(id, action, data);
	}

	/**
	 * Returns all spawned processes.
	 */
	public async getSpawnedProcesses(): Promise<SpawnedProcess[]> {
		return os.getSpawnedProcesses();
	}

	/**
	 * Provides the value of a given environment variable.
	 * @param key The name of the environment variable.
	 */
	public async getEnv(key: string): Promise<string> {
		return os.getEnv(key);
	}

	/**
	 * Returns all environment variables and their values.
	 */
	public async getEnvs(): Promise<Envs> {
		return os.getEnvs();
	}

	/**
	 * Shows the file open dialog. You can use this function to obtain paths of existing files.
	 * @param title Title of the dialog.
	 * @param options Open dialog options.
	 */
	public async showOpenDialog(title?: string, options?: OpenDialogOptions): Promise<string[]> {
		return os.showOpenDialog(title, options);
	}

	/**
	 * Shows the file save dialog. You can use this function to obtain a path to create a new file.
	 * @param title Title of the dialog.
	 * @param options Save dialog options.
	 */
	public async showSaveDialog(title?: string, options?: SaveDialogOptions): Promise<string> {
		return os.showSaveDialog(title, options);
	}

	/**
	 * Shows the folder open dialog.
	 * @param title Title of the dialog.
	 * @param options Folder dialog options.
	 */
	public async showFolderDialog(title?: string, options?: FolderDialogOptions): Promise<string> {
		return os.showFolderDialog(title, options);
	}

	/**
	 * Displays a notification message.
	 * @param title Notification title.
	 * @param content Content of the notification.
	 * @param icon Icon name.
	 */
	public async showNotification(title: string, content: string, icon?: Icon): Promise<void> {
		return os.showNotification(title, content, icon);
	}

	/**
	 * Displays a message box.
	 * @param title Title of the message box.
	 * @param content Content of the message box.
	 * @param choice Message box buttons.
	 * @param icon Icon name.
	 */
	public async showMessageBox(title: string, content: string, choice?: MessageBoxChoice, icon?: Icon): Promise<string> {
		return os.showMessageBox(title, content, choice, icon);
	}

	/**
	 * Creates/updates the tray icon and menu.
	 * @param options Tray configuration options.
	 */
	public async setTray(options: TrayOptions): Promise<void> {
		return os.setTray(options);
	}

	/**
	 * Returns known platform-specific folders such as Downloads, Music, Videos, etc.
	 * @param name Name of the folder.
	 */
	public async getPath(name: NeutralinoKnownPath): Promise<string> {
		return os.getPath(name as KnownPath);
	}

	/**
	 * Opens a URL with the default web browser.
	 * @param url URL to be opened.
	 */
	public async open(url: string): Promise<void> {
		return os.open(url);
	}

	/**
	 * Sends a file or directory into the system trash container.
	 * Throws NE_OS_UNLTRAS on failures.
	 * @param path Directory or file path.
	 */
	public async trashItem(path: string): Promise<string> {
		return os.trashItem(path);
	}
}
