// BROWSER ONLY
import type { StorageAdapter } from "./Storage";

/**
 * Configuration for {@link Storage_LocalStorageAdapter}.
 */
export interface LocalStorageAdapterOptions {
	/**
	 * Optional prefix prepended to every key, useful for namespacing so this
	 * adapter doesn't collide with other data an app keeps in `localStorage`.
	 * Defaults to `''` (no prefix).
	 */
	prefix?: string;
}

/**
 * `role: 'cache'` adapter backed by the browser's `window.localStorage`.
 *
 * Browser-only by design — `isAvailable()` returns `false` in any
 * environment without a working `localStorage` (Node/Bun/Deno, SSR, or
 * browsers with storage disabled/full, e.g. Safari private mode), so
 * {@link Storage} will simply skip it there rather than throw.
 *
 * Values are JSON-serialized on write and parsed on read, so any
 * JSON-safe value (not just strings) can be stored.
 *
 * @example
 * ```ts
 * const storage = new Storage({
 *   adapters: [new LocalStorageAdapter({ prefix: 'myapp:' })],
 * });
 * ```
 */
export default class Storage_LocalStorageAdapter implements StorageAdapter {
	private prefix: string;

	constructor(options: LocalStorageAdapterOptions = {}) {
		this.prefix = options.prefix ?? "";
	}

	/**
	 * True only in a browser-like environment where `localStorage` exists
	 * and is actually writable. Performs a tiny write/remove probe because
	 * `localStorage` can exist but still throw (e.g. quota exceeded, private
	 * browsing mode in older Safari).
	 */
	isAvailable(): boolean {
		try {
			if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
				return false;
			}
			const probeKey = "__storage_probe__";
			window.localStorage.setItem(probeKey, "1");
			window.localStorage.removeItem(probeKey);
			return true;
		} catch {
			return false;
		}
	}

	async get<T>(key: string): Promise<T | null> {
		const raw = window.localStorage.getItem(this.namespacedKey(key));
		if (raw === null) {
			return null;
		}
		try {
			return JSON.parse(raw) as T;
		} catch {
			// Value wasn't valid JSON (e.g. written by something else) — treat as absent.
			return null;
		}
	}

	async set<T>(key: string, value: T): Promise<void> {
		window.localStorage.setItem(this.namespacedKey(key), JSON.stringify(value));
	}

	async remove(key: string): Promise<void> {
		window.localStorage.removeItem(this.namespacedKey(key));
	}

	private namespacedKey(key: string): string {
		return this.prefix ? `${this.prefix}${key}` : key;
	}
}
