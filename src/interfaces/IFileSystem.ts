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

export interface IFileSystem {
	createDirectory(path: string): Promise<void>;
	remove(path: string): Promise<void>;
	writeFile(filename: string, data: string): Promise<void>;
	appendFile(filename: string, data: string): Promise<void>;
	writeBinaryFile(filename: string, data: ArrayBuffer): Promise<void>;
	appendBinaryFile(filename: string, data: ArrayBuffer): Promise<void>;
	readFile(filename: string, options?: FileReaderOptions): Promise<string>;
	readBinaryFile(filename: string, options?: FileReaderOptions): Promise<ArrayBuffer>;
	openFile(filename: string): Promise<number>;
	updateOpenedFile(id: number, action: string, data?: number): Promise<void>;
	getOpenedFileInfo(id: number): Promise<OpenedFile>;
	createWatcher(path: string): Promise<number>;
	removeWatcher(watcherId: number): Promise<number>;
	getWatchers(): Promise<Watcher[]>;
	readDirectory(path: string, options?: DirectoryReaderOptions): Promise<DirectoryEntry[]>;
	copy(source: string, destination: string, options?: CopyOptions): Promise<void>;
	move(source: string, destination: string): Promise<void>;
	getStats(path: string): Promise<Stats>;
	exists(path: string): Promise<boolean>;
	getAbsolutePath(path: string): Promise<string>;
	getRelativePath(path: string, base?: string): Promise<string>;
	getPathParts(path: string): Promise<PathParts>;
	getJoinedPath(...paths: string[]): Promise<string>;
	getNormalizedPath(path: string): Promise<string>;
	getUnnormalizedPath(path: string): Promise<string>;
	access(path: string, mode?: number): Promise<string>;
	chmod(path: string, mode: number): Promise<string>;
	chown(path: string, uid: number, gid: number): Promise<string>;
}
