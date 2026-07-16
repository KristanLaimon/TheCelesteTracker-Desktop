import type {
	CopyOptions,
	DirectoryEntry,
	DirectoryReaderOptions,
	FileReaderOptions,
	OpenedFile,
	PathParts,
	Permissions,
	PermissionsMode,
	Stats,
	Watcher,
} from '@neutralinojs/lib';
import { filesystem } from '@neutralinojs/lib';
import { injectable } from 'tsyringe';

/**
 * FileSystem is a robust, type-safe wrapper around the Neutralino.filesystem API.
 * Provides easy access to local file operations, directory reading, file watching, and statistics.
 */
@injectable()
export class NeutralinoFileSystem {
	/**
	 * Creates a directory or multiple directories recursively.
	 * @param path New directory path.
	 */
	public async createDirectory(path: string): Promise<void> {
		return filesystem.createDirectory(path);
	}

	/**
	 * Removes a directory or file. Recursively removes directory contents.
	 * @param path Directory or file path.
	 */
	public async remove(path: string): Promise<void> {
		return filesystem.remove(path);
	}

	/**
	 * Writes text content to a file. Overwrites the file if it exists.
	 * @param filename File path.
	 * @param data Content string to write.
	 */
	public async writeFile(filename: string, data: string): Promise<void> {
		return filesystem.writeFile(filename, data);
	}

	/**
	 * Appends text content to a file. Creates the file if it doesn't exist.
	 * @param filename File path.
	 * @param data Content string to append.
	 */
	public async appendFile(filename: string, data: string): Promise<void> {
		return filesystem.appendFile(filename, data);
	}

	/**
	 * Writes binary data to a file. Overwrites the file if it exists.
	 * @param filename File path.
	 * @param data Binary content as ArrayBuffer.
	 */
	public async writeBinaryFile(filename: string, data: ArrayBuffer): Promise<void> {
		return filesystem.writeBinaryFile(filename, data);
	}

	/**
	 * Appends binary data to a file. Creates the file if it doesn't exist.
	 * @param filename File path.
	 * @param data Binary content as ArrayBuffer.
	 */
	public async appendBinaryFile(filename: string, data: ArrayBuffer): Promise<void> {
		return filesystem.appendBinaryFile(filename, data);
	}

	/**
	 * Reads a text file.
	 * @param filename File path.
	 * @param options Position cursor and buffer read size limits.
	 */
	public async readFile(filename: string, options?: FileReaderOptions): Promise<string> {
		return filesystem.readFile(filename, options);
	}

	/**
	 * Reads a binary file.
	 * @param filename File path.
	 * @param options Position cursor and buffer read size limits.
	 */
	public async readBinaryFile(filename: string, options?: FileReaderOptions): Promise<ArrayBuffer> {
		return filesystem.readBinaryFile(filename, options);
	}

	/**
	 * Creates a readable file stream.
	 * @param filename File path.
	 * @returns File stream identifier (number).
	 */
	public async openFile(filename: string): Promise<number> {
		return filesystem.openFile(filename);
	}

	/**
	 * Invokes file stream actions (read, readBinary, readAll, readAllBinary, seek, close).
	 * @param id File stream identifier.
	 * @param action The action to perform.
	 * @param data Action parameters (buffer size for read, cursor position for seek).
	 */
	public async updateOpenedFile(id: number, action: string, data?: any): Promise<void> {
		return filesystem.updateOpenedFile(id, action, data);
	}

	/**
	 * Returns file stream details.
	 * @param id File stream identifier.
	 */
	public async getOpenedFileInfo(id: number): Promise<OpenedFile> {
		return filesystem.getOpenedFileInfo(id);
	}

	/**
	 * Creates a filesystem watcher for a specific directory path.
	 * If one already exists for the given path, returns the existing watcher identifier.
	 * @param path Directory path to watch.
	 * @returns File watcher identifier.
	 */
	public async createWatcher(path: string): Promise<number> {
		return filesystem.createWatcher(path);
	}

	/**
	 * Removes a filesystem watcher.
	 * @param watcherId Watcher identifier.
	 * @returns Removed file watcher identifier.
	 */
	public async removeWatcher(watcherId: number): Promise<number> {
		return filesystem.removeWatcher(watcherId);
	}

	/**
	 * Returns information about all active file watchers.
	 */
	public async getWatchers(): Promise<Watcher[]> {
		return filesystem.getWatchers();
	}

	/**
	 * Reads directory contents.
	 * @param path Directory path.
	 * @param options Recursive directory reading configurations.
	 */
	public async readDirectory(path: string, options?: DirectoryReaderOptions): Promise<DirectoryEntry[]> {
		return filesystem.readDirectory(path, options);
	}

	/**
	 * Copies a file or directory to a new destination.
	 * @param source Source path.
	 * @param destination Destination path.
	 * @param options Copy configuration (recursive, overwrite, skip).
	 */
	public async copy(source: string, destination: string, options?: CopyOptions): Promise<void> {
		return filesystem.copy(source, destination, options);
	}

	/**
	 * Moves a file or directory to a new destination.
	 * @param source Source path.
	 * @param destination Destination path.
	 */
	public async move(source: string, destination: string): Promise<void> {
		return filesystem.move(source, destination);
	}

	/**
	 * Returns file statistics for the given path.
	 * @param path File or directory path.
	 */
	public async getStats(path: string): Promise<Stats> {
		return filesystem.getStats(path);
	}

	/**
	 * Checks if a file or directory exists at the given path.
	 * @param path File or directory path.
	 */
	public async exists(path: string): Promise<boolean> {
		try {
			await filesystem.getStats(path);
			return true;
		} catch (e: unknown) {
			console.error(e);
			return false;
		}
	}

	/**
	 * Returns the absolute path for a given path (works even if path does not exist).
	 * @param path Relative path.
	 */
	public async getAbsolutePath(path: string): Promise<string> {
		return filesystem.getAbsolutePath(path);
	}

	/**
	 * Returns the relative path for a given path and base.
	 * @param path Path.
	 * @param base Base path (defaults to NL_CWD).
	 */
	public async getRelativePath(path: string, base?: string): Promise<string> {
		return filesystem.getRelativePath(path, base);
	}

	/**
	 * Parses a given path and returns its parts (filename, extension, stem, parent directory, etc).
	 * @param path Path string.
	 */
	public async getPathParts(path: string): Promise<PathParts> {
		return filesystem.getPathParts(path);
	}

	/**
	 * Sets file permissions for a given path.
	 * @param path File or directory path.
	 * @param permissions Permission config object.
	 * @param mode Permission replacement mode (ADD, REPLACE, REMOVE).
	 */
	public async setPermissions(path: string, permissions: Permissions, mode?: PermissionsMode): Promise<void> {
		return filesystem.setPermissions(path, permissions, mode ?? 'REPLACE');
	}

	/**
	 * Returns file permissions for a given path.
	 * @param path File or directory path.
	 */
	public async getPermissions(path: string): Promise<Permissions> {
		return filesystem.getPermissions(path);
	}

	/**
	 * Returns a single joined path from multiple input path segments.
	 * @param paths Sequence of path segments.
	 */
	public async getJoinedPath(...paths: string[]): Promise<string> {
		return filesystem.getJoinedPath(...paths);
	}

	/**
	 * Constructs a Unix-like path from a Windows path (replacing \\ with /).
	 * Returns the same string on non-Windows platforms.
	 * @param path Windows-specific path.
	 */
	public async getNormalizedPath(path: string): Promise<string> {
		return filesystem.getNormalizedPath(path);
	}

	/**
	 * Reverts a Unix-like path to a Windows-specific path (replacing / with \\).
	 * Returns the same string on non-Windows platforms.
	 * @param path Unix-like path.
	 */
	public async getUnnormalizedPath(path: string): Promise<string> {
		return filesystem.getUnnormalizedPath(path);
	}

	/**
	 * Executes POSIX access operation to test existing file permissions.
	 * @param path Directory or file path.
	 * @param mode POSIX file access mode (0 = exist, 1 = execute, 2 = write, 4 = read).
	 */
	public async access(path: string, mode?: number): Promise<string> {
		return filesystem.access(path, mode);
	}

	/**
	 * Executes POSIX chmod operation for file access permission changes.
	 * @param path Directory or file path.
	 * @param mode POSIX file permission.
	 */
	public async chmod(path: string, mode: number): Promise<string> {
		return filesystem.chmod(path, mode);
	}

	/**
	 * Executes POSIX chown operation to change file ownership.
	 * @param path Directory or file path.
	 * @param uid User identifier.
	 * @param gid Group identifier.
	 */
	public async chown(path: string, uid: number, gid: number): Promise<string> {
		return filesystem.chown(path, uid, gid);
	}
}
