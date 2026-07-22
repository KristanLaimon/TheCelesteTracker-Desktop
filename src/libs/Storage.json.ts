// UNIVERSAL COMPATIBILITY
import { inject, injectable } from 'tsyringe';
import { IFileSystem_Token, IPath_Token } from '../interfaces/DependencyInjectionTokens';
import type { IFileSystem } from '../interfaces/IFileSystem';
import type { IPath } from '../interfaces/IPath';
import type { StorageAdapter } from './Storage';

/**
 * Configuration for {@link Storage_JsonFileAdapter}.
 */
export interface JsonFileAdapterOptions {
	/** Absolute or relative path to the JSON file used as the backing store. */
	filePath: string;
	/**
	 * Indentation (spaces) used when writing the JSON file, for readability.
	 * Pass `0` for compact/minified output. Defaults to `0`.
	 */
	indent?: number;
}

/**
 * `role: 'persistent'` adapter that stores every key inside a single JSON
 * file on disk. Works unmodified on Node.js, Bun, and Deno (via Deno's
 * `node:fs` compatibility layer) since it only relies on `node:fs/promises`
 * and `node:path`.
 *
 * ### How it works
 * The whole file is treated as one flat `{ [key]: value }` object. It's
 * lazily read into memory on first access and kept in memory afterward;
 * every `set`/`remove` rewrites the entire file. Reads/writes are serialized
 * through an internal queue so concurrent calls (e.g. `Promise.all` over
 * several dirty keys during `Storage.triggerSave`) can't interleave and
 * corrupt the file.
 *
 * This adapter is **not** meant for browsers — see {@link LocalStorageAdapter}
 * for that. `isAvailable()` returns `false` outside of Node/Bun/Deno.
 *
 * @example
 * ```ts
 * const storage = new Storage({
 *   adapters: [new JsonFileAdapter({ filePath: './data/storage.json' })],
 * });
 * ```
 */
@injectable()
export default class Storage_JsonFileAdapter implements StorageAdapter {
	private filePath: string;
	private indent: number;

	/** In-memory mirror of the JSON file's contents, once loaded. `null` until first load. */
	private cache: Record<string, unknown> | null = null;

	/** Promise chain used as a simple mutex so file reads/writes never overlap. */
	private queue: Promise<unknown> = Promise.resolve();

	constructor(
		options: JsonFileAdapterOptions,
		@inject(IFileSystem_Token) private fsModule: IFileSystem,
		@inject(IPath_Token) private path: IPath,
	) {
		this.filePath = options.filePath;
		this.indent = options.indent ?? 0;
	}

	/**
	 * True when running under Node.js, Bun, or Deno (all of which expose a
	 * `node:fs/promises`-compatible API). Always `false` in browsers.
	 */
	isAvailable(): boolean {
		return true; //Was made compatible with neutralinojs and node.js/bun system thanks to DI!
	}

	async get<T>(key: string): Promise<T | null> {
		return this.enqueue(async () => {
			const data = await this.load();
			return key in data ? (data[key] as T) : null;
		});
	}

	async set<T>(key: string, value: T): Promise<void> {
		await this.enqueue(async () => {
			const data = await this.load();
			data[key] = value;
			await this.persist(data);
		});
	}

	async remove(key: string): Promise<void> {
		await this.enqueue(async () => {
			const data = await this.load();
			delete data[key];
			await this.persist(data);
		});
	}

	/**
	 * Runs `task` after any previously queued task finishes, guaranteeing
	 * file operations never run concurrently against each other.
	 */
	private enqueue<T>(task: () => Promise<T>): Promise<T> {
		const run = this.queue.then(task, task);
		// Swallow errors here so one failed task doesn't jam the queue for
		// subsequent, unrelated calls — the real error still propagates via `run`.
		this.queue = run.then(
			() => undefined,
			() => undefined,
		);
		return run;
	}

	private async load(): Promise<Record<string, unknown>> {
		if (this.cache) {
			return this.cache;
		}

		try {
			const raw = await this.fsModule.readFile(this.filePath);
			this.cache = raw.trim().length > 0 ? JSON.parse(raw) : {};
		} catch {
			this.cache = {};
		}

		return this.cache!;
	}

	/** Writes `data` to disk, creating the parent directory if it doesn't exist yet. */
	private async persist(data: Record<string, unknown>): Promise<void> {
		const dir = this.path.dirname(this.filePath);
		await this.fsModule.createDirectory(dir, { recursive: true });

		const json = this.indent > 0 ? JSON.stringify(data, null, this.indent) : JSON.stringify(data);
		await this.fsModule.writeFile(this.filePath, json);
	}
}
