import type { StorageAdapter } from '../src/libs/Storage';

/**
 * `role: 'cache'` adapter backed by a plain in-memory `Map`.
 *
 * The simplest possible {@link StorageAdapter} — no browser or backend APIs
 * involved, so it works identically everywhere (Node, Bun, Deno, browsers).
 * `isAvailable()` is always `true`.
 *
 * Data lives only for the lifetime of the `Storage` instance / process — it
 * is **not** persisted anywhere. Useful as a zero-dependency default cache
 * layer, in tests, or anywhere you just want in-memory speed without wiring
 * up `localStorage` or a file adapter.
 *
 * @example
 * ```ts
 * const storage = new Storage({
 *   adapters: [new SimpleMapAdapter()],
 * });
 * ```
 */
export default class Storage_SimpleMapAdapter implements StorageAdapter {

	private map = new Map<string, unknown>();

	/** Always `true` — a `Map` works in every JS environment. */
	isAvailable(): boolean {
		return true;
	}

	async get<T>(key: string): Promise<T | null> {
		return this.map.has(key) ? (this.map.get(key) as T) : null;
	}

	async set<T>(key: string, value: T): Promise<void> {
		this.map.set(key, value);
	}

	async remove(key: string): Promise<void> {
		this.map.delete(key);
	}
}