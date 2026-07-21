// NODE.JS/BUN/DENO ONLY
// biome-ignore-all lint/style/useImportType: DI Needed
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { injectable } from 'tsyringe';
// Type-only imports for the interfaces
import type {
	CopyOptions,
	DirectoryEntry,
	DirectoryReaderOptions,
	FileReaderOptions,
	OpenedFile,
	PathParts,
	Stats,
	Watcher,
} from '../src/interfaces/IFileSystem';
import type { IFileSystem } from '../src/interfaces/IFileSystem';

@injectable()
export default class NodeJsFileSystem implements IFileSystem {
	private fileHandles = new Map<number, fs.FileHandle>();
	private watchers = new Map<number, { path: string; abortController: AbortController }>();
	private nextHandleId = 1;
	private nextWatcherId = 1;

	public async createDirectory(dirPath: string): Promise<void> {
		await fs.mkdir(dirPath, { recursive: true });
	}

	public async remove(targetPath: string): Promise<void> {
		await fs.rm(targetPath, { recursive: true, force: true });
	}

	public async writeFile(filename: string, data: string): Promise<void> {
		await fs.writeFile(filename, data, 'utf-8');
	}

	public async appendFile(filename: string, data: string): Promise<void> {
		await fs.appendFile(filename, data, 'utf-8');
	}

	public async writeBinaryFile(filename: string, data: ArrayBuffer): Promise<void> {
		await fs.writeFile(filename, Buffer.from(data));
	}

	public async appendBinaryFile(filename: string, data: ArrayBuffer): Promise<void> {
		await fs.appendFile(filename, Buffer.from(data));
	}

	public async readFile(filename: string, options?: FileReaderOptions): Promise<string> {
		const content = await fs.readFile(filename, 'utf-8');
		if (options && (options.pos !== undefined || options.size !== undefined)) {
			const start = options.pos || 0;
			const end = options.size ? start + options.size : undefined;
			return content.slice(start, end);
		}
		return content;
	}

	public async readBinaryFile(filename: string, options?: FileReaderOptions): Promise<ArrayBuffer> {
		const buffer = await fs.readFile(filename);
		const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

		if (options && (options.pos !== undefined || options.size !== undefined)) {
			const start = options.pos || 0;
			const end = options.size ? start + options.size : undefined;
			return arrayBuffer.slice(start, end);
		}
		return arrayBuffer;
	}

	public async openFile(filename: string): Promise<number> {
		const handle = await fs.open(filename, 'r+');
		const id = this.nextHandleId++;
		this.fileHandles.set(id, handle);
		return id;
	}

	public async updateOpenedFile(id: number, action: string, _data?: number): Promise<void> {
		const handle = this.fileHandles.get(id);
		if (!handle) throw new Error(`File handle ${id} not found`);

		if (action === 'close') {
			await handle.close();
			this.fileHandles.delete(id);
		}
	}

	public async getOpenedFileInfo(id: number): Promise<OpenedFile> {
		const handle = this.fileHandles.get(id);
		if (!handle) throw new Error(`File handle ${id} not found`);

		// Utilize stat to estimate lastRead/pos if necessary, though Node handles are stateless streams
		const stat = await handle.stat();

		return {
			id,
			eof: false,
			pos: 0,
			lastRead: stat.mtimeMs,
		};
	}

	public async createWatcher(targetPath: string): Promise<number> {
		const id = this.nextWatcherId++;
		const ac = new AbortController();

		this.watchers.set(id, { path: targetPath, abortController: ac });

		(async () => {
			try {
				const watcher = fs.watch(targetPath, { signal: ac.signal });
				for await (const _event of watcher) {
					// Event dispatching logic would go here if IFileSystem exposed an event emitter
				}
			} catch (err) {
				if ((err as Error).name !== 'AbortError') throw err;
			}
		})();

		return id;
	}

	public async removeWatcher(watcherId: number): Promise<number> {
		const watcher = this.watchers.get(watcherId);
		if (watcher) {
			watcher.abortController.abort();
			this.watchers.delete(watcherId);
		}
		return watcherId;
	}

	public async getWatchers(): Promise<Watcher[]> {
		return Array.from(this.watchers.entries()).map(([id, watcher]) => ({
			id,
			path: watcher.path,
		}));
	}

	public async readDirectory(targetPath: string, options?: DirectoryReaderOptions): Promise<DirectoryEntry[]> {
		const isRecursive = options?.recursive ?? false;

		// Node v20+ supports recursive readdir directly
		const entries = await fs.readdir(targetPath, {
			withFileTypes: true,
			recursive: isRecursive,
		});

		return entries.map((entry) => {
			// Node >v20 uses `parentPath`, older versions use `path`
			const parentDir = (entry as { parentPath?: string; path?: string }).parentPath ?? (entry as { parentPath?: string; path?: string }).path;
			let entryName = entry.name;

			if (isRecursive && parentDir) {
				const relativeDir = path.relative(targetPath, parentDir);
				if (relativeDir) {
					entryName = path.join(relativeDir, entry.name);
				}
			}

			// Convert backslashes to forward slashes for cross-platform consistency
			entryName = entryName.split(path.win32.sep).join(path.posix.sep);

			return {
				entry: entryName,
				type: entry.isDirectory() ? 'DIRECTORY' : 'FILE',
			};
		});
	}

	public async copy(source: string, destination: string, options?: CopyOptions): Promise<void> {
		const recursive = options?.recursive ?? false;
		const skip = options?.skip ?? false;

		// If 'skip' is true, force must be false to avoid overwriting.
		// Otherwise, respect the 'overwrite' flag (defaults to true if omitted).
		const force = skip ? false : (options?.overwrite ?? true);

		await fs.cp(source, destination, {
			recursive,
			force,
			errorOnExist: false,
		});
	}

	public async move(source: string, destination: string): Promise<void> {
		await fs.rename(source, destination);
	}

	public async getStats(targetPath: string): Promise<Stats> {
		const stat = await fs.stat(targetPath);
		return {
			size: stat.size,
			isFile: stat.isFile(),
			isDirectory: stat.isDirectory(),
			createdAt: stat.birthtimeMs,
			modifiedAt: stat.mtimeMs,
		};
	}

	public async exists(targetPath: string): Promise<boolean> {
		try {
			await fs.access(targetPath);
			return true;
		} catch {
			return false;
		}
	}

	public async getAbsolutePath(targetPath: string): Promise<string> {
		return path.resolve(targetPath);
	}

	public async getRelativePath(targetPath: string, base?: string): Promise<string> {
		return path.relative(base || process.cwd(), targetPath);
	}

	public async getPathParts(targetPath: string): Promise<PathParts> {
		const parsed = path.parse(targetPath);
		return {
			root: parsed.root,
			dir: parsed.dir,
			base: parsed.base,
			ext: parsed.ext,
			name: parsed.name,
		};
	}

	public async getJoinedPath(...paths: string[]): Promise<string> {
		return path.join(...paths);
	}

	public async getNormalizedPath(targetPath: string): Promise<string> {
		return path.posix.normalize(targetPath.split(path.win32.sep).join(path.posix.sep));
	}

	public async getUnnormalizedPath(targetPath: string): Promise<string> {
		return path.win32.normalize(targetPath.split(path.posix.sep).join(path.win32.sep));
	}

	public async access(targetPath: string, mode?: number): Promise<string> {
		await fs.access(targetPath, mode);
		return '';
	}

	public async chmod(targetPath: string, mode: number): Promise<string> {
		await fs.chmod(targetPath, mode);
		return '';
	}

	public async chown(targetPath: string, uid: number, gid: number): Promise<string> {
		await fs.chown(targetPath, uid, gid);
		return '';
	}
}
