export interface Stats {
	size: number;
	isFile: boolean;
	isDirectory: boolean;
	createdAt: number;
	modifiedAt: number;
}

export interface DirectoryEntry {
	entry: string;
	type: 'FILE' | 'DIRECTORY' | string;
}

export interface FileReaderOptions {
	pos?: number;
	size?: number;
}

export interface DirectoryReaderOptions {
	recursive?: boolean;
}

export interface OpenedFile {
	id: number;
	eof: boolean;
	pos: number;
	lastRead: number;
}

export interface Watcher {
	id: number;
	path: string;
}

export interface CopyOptions {
	recursive?: boolean;
	overwrite?: boolean;
	skip?: boolean;
}

export interface PathParts {
	root: string;
	dir: string;
	base: string;
	ext: string;
	name: string;
}

// export type PermissionsMode = 'ADD' | 'REMOVE' | 'REPLACE';

// export interface Permissions {
// 	owner?: { read?: boolean; write?: boolean; execute?: boolean };
// 	group?: { read?: boolean; write?: boolean; execute?: boolean };
// 	others?: { read?: boolean; write?: boolean; execute?: boolean };
// }

export abstract class IFileSystem {
	abstract createDirectory(path: string): Promise<void>;
	abstract remove(path: string): Promise<void>;
	abstract writeFile(filename: string, data: string): Promise<void>;
	abstract appendFile(filename: string, data: string): Promise<void>;
	abstract writeBinaryFile(filename: string, data: ArrayBuffer): Promise<void>;
	abstract appendBinaryFile(filename: string, data: ArrayBuffer): Promise<void>;
	abstract readFile(filename: string, options?: FileReaderOptions): Promise<string>;
	abstract readBinaryFile(filename: string, options?: FileReaderOptions): Promise<ArrayBuffer>;
	abstract openFile(filename: string): Promise<number>;
	abstract updateOpenedFile(id: number, action: string, data?: number): Promise<void>;
	abstract getOpenedFileInfo(id: number): Promise<OpenedFile>;
	abstract createWatcher(path: string): Promise<number>;
	abstract removeWatcher(watcherId: number): Promise<number>;
	abstract getWatchers(): Promise<Watcher[]>;
	abstract readDirectory(path: string, options?: DirectoryReaderOptions): Promise<DirectoryEntry[]>;
	abstract copy(source: string, destination: string, options?: CopyOptions): Promise<void>;
	abstract move(source: string, destination: string): Promise<void>;
	abstract getStats(path: string): Promise<Stats>;
	abstract exists(path: string): Promise<boolean>;
	abstract getAbsolutePath(path: string): Promise<string>;
	abstract getRelativePath(path: string, base?: string): Promise<string>;
	abstract getPathParts(path: string): Promise<PathParts>;
	abstract getJoinedPath(...paths: string[]): Promise<string>;
	abstract getNormalizedPath(path: string): Promise<string>;
	abstract getUnnormalizedPath(path: string): Promise<string>;
	abstract access(path: string, mode?: number): Promise<string>;
	abstract chmod(path: string, mode: number): Promise<string>;
	abstract chown(path: string, uid: number, gid: number): Promise<string>;
}
