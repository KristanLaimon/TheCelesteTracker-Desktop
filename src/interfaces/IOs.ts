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

export type SpawnedProcessAction = 'stdIn' | 'stdInEnd' | 'exit';

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

export type Icon = 'INFO' | 'WARNING' | 'ERROR' | 'QUESTION';

export type MessageBoxChoice = 'OK' | 'OK_CANCEL' | 'YES_NO' | 'YES_NO_CANCEL' | 'RETRY_CANCEL' | 'ABORT_RETRY_IGNORE';

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

export type NeutralinoKnownPath =
	| 'config'
	| 'data'
	| 'local'
	| 'cache'
	| 'temp'
	| 'downloads'
	| 'music'
	| 'pictures'
	| 'videos'
	| 'home'
	| 'desktop'
	| 'saveGames1'
	| 'saveGames2'
	| string;

export abstract class IOS {
	abstract execCommand(command: string, options?: ExecCommandOptions): Promise<ExecCommandResult>;
	abstract spawnProcess(command: string, options?: SpawnedProcessOptions): Promise<SpawnedProcess>;
	abstract updateSpawnedProcess(id: number, action: SpawnedProcessAction, data?: string): Promise<void>;
	abstract getSpawnedProcesses(): Promise<SpawnedProcess[]>;
	abstract getEnv(key: string): Promise<string>;
	abstract getEnvs(): Promise<Envs>;
	abstract showOpenDialog(title?: string, options?: OpenDialogOptions): Promise<string[]>;
	abstract showSaveDialog(title?: string, options?: SaveDialogOptions): Promise<string>;
	abstract showFolderDialog(title?: string, options?: FolderDialogOptions): Promise<string>;
	abstract showNotification(title: string, content: string, icon?: Icon): Promise<void>;
	abstract showMessageBox(title: string, content: string, choice?: MessageBoxChoice, icon?: Icon): Promise<string>;
	abstract setTray(options: TrayOptions): Promise<void>;
	abstract getPath(name: NeutralinoKnownPath): Promise<string>;
	abstract open(url: string): Promise<void>;
	abstract trashItem(path: string): Promise<string>;
}
