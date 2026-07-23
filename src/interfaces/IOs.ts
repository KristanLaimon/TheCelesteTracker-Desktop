// UNIVERSAL COMPATIBILITY
// IOS.ts

export interface ExecCommandOptions {
	envs?: Record<string, string>;
	background?: boolean;
	stdIn?: string;
}

export interface ExecCommandResult {
	pid: number;
	stdOut: string;
	stdErr: string;
	exitCode: number;
}

export interface SpawnedProcessOptions {
	envs?: Record<string, string>;
}

export interface SpawnedProcess {
	id: number;
	pid: number;
}

export type SpawnedProcessAction = "stdIn" | "stdInEnd" | "exit";

export type Envs = Record<string, string>;

export interface Filter {
	name: string;
	extensions: string[];
}

export interface OpenDialogOptions {
	filters?: Filter[];
	multiSelections?: boolean;
	defaultPath?: string;
}

export interface SaveDialogOptions {
	filters?: Filter[];
	forceOverwrite?: boolean;
	defaultPath?: string;
}

export interface FolderDialogOptions {
	defaultPath?: string;
}

export type Icon = "INFO" | "WARNING" | "ERROR" | "QUESTION";

export type MessageBoxChoice = "OK" | "OK_CANCEL" | "YES_NO" | "YES_NO_CANCEL" | "RETRY_CANCEL" | "ABORT_RETRY_IGNORE";

export interface TrayMenuItem {
	id?: string;
	text: string;
	isDisabled?: boolean;
	isChecked?: boolean;
}

export interface TrayOptions {
	icon: string;
	menuItems: TrayMenuItem[];
}

export type CommonKnownPath =
	| "config"
	| "data"
	| "local"
	| "cache"
	| "temp"
	| "downloads"
	| "music"
	| "pictures"
	| "videos"
	| "home"
	| "desktop"
	| "saveGames1"
	| "saveGames2"
	| string;

export interface IOS {
	getCurrentOS(): "windows" | "macos" | "freebsd" | "linux" | "unknown";
	execCommand(command: string, options?: ExecCommandOptions): Promise<ExecCommandResult>;
	spawnProcess(command: string, options?: SpawnedProcessOptions): Promise<SpawnedProcess>;
	updateSpawnedProcess(id: number, action: SpawnedProcessAction, data?: string): Promise<void>;
	getSpawnedProcesses(): Promise<SpawnedProcess[]>;
	getEnv(key: string): Promise<string>;
	getEnvs(): Promise<Envs>;
	showOpenDialog(title?: string, options?: OpenDialogOptions): Promise<string[]>;
	showSaveDialog(title?: string, options?: SaveDialogOptions): Promise<string>;
	showFolderDialog(title?: string, options?: FolderDialogOptions): Promise<string>;
	showNotification(title: string, content: string, icon?: Icon): Promise<void>;
	showMessageBox(title: string, content: string, choice?: MessageBoxChoice, icon?: Icon): Promise<string>;
	setTray(options: TrayOptions): Promise<void>;
	getPath(name: CommonKnownPath): Promise<string>;
	open(url: string): Promise<void>;
	trashItem(path: string): Promise<string>;
}
