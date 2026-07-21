import { injectable } from "tsyringe";

/**
 * Contract every storage backend must implement to plug into {@link Storage}.
 *
 * Implementations are expected to be "dumb" — they just get/set/remove raw
 * values for a given key. All caching, layering, and history logic lives in
 * the {@link Storage} class itself.
 */
export interface StorageAdapter {
	/** Determines if this adapter acts as a fast cache layer or a hard persistent layer */
	role: 'cache' | 'persistent';
	/** Determines if the environment supports this adapter (e.g. `localStorage` may not exist in Node) */
	isAvailable(): boolean;
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T): Promise<void>;
	remove(key: string): Promise<void>;
}

/**
 * A single recorded mutation, used internally to support {@link Storage.restoreLastChange}.
 *
 * It stores whatever is needed to *undo* the change — i.e. the state of the
 * key immediately before the mutation happened, not the new state.
 */
export interface HistoryEntry<T = unknown> {
	/** The key that was mutated. */
	key: string;
	/** The value the key held before the mutation (undefined/irrelevant if `hadValue` is false). */
	previousValue: T | null;
	/** Whether the key actually existed before the mutation (distinguishes "was empty" from "was removed"). */
	hadValue: boolean;
	/** `Date.now()` at the time the mutation was recorded. */
	timestamp: number;
}

/**
 * Opt-in configuration that turns on the undo history feature.
 *
 * History is disabled entirely unless this object is supplied. It requires
 * its own dedicated **persistent** adapter — separate from (and never taken
 * from) the main `adapters` list — so history storage never competes with or
 * hijacks the adapters configured for regular keys.
 */
export interface HistoryOptions {
	/**
	 * Dedicated adapter used exclusively to persist the undo history.
	 * Must have `role: 'persistent'` (history has no cache tier of its own).
	 */
	adapter: StorageAdapter;
	/**
	 * Maximum number of entries kept in the undo history.
	 * Once exceeded, the oldest entry is dropped to make room.
	 * Defaults to {@link Storage.DEFAULT_HISTORY_SIZE} (50) when omitted.
	 */
	size?: number;
}

/**
 * Configuration object passed to the {@link Storage} constructor.
 */
export interface StorageOptions {
	/** The list of adapters to use. Unavailable adapters (per `isAvailable()`) are filtered out automatically. */
	adapters: StorageAdapter[];
	/**
	 * Interval in minutes to trigger an automatic persistent save.
	 * `0` or `undefined` disables auto-saving at construction time.
	 * Can be changed later via {@link Storage.configureAutoSave}.
	 */
	saveMinutesInterval?: number;
	/**
	 * Enables the undo history feature. Omit this entirely to keep history
	 * disabled (the default) — no tracking overhead, no extra writes. Pass it
	 * with a dedicated persistent `adapter` to turn history on.
	 */
	history?: HistoryOptions;
}

/**
 * Layered key/value store with three read tiers (in-memory → cache adapters →
 * persistent adapters), debounced persistent writes, an optional bounded LIFO
 * undo history, and a configurable auto-save timer.
 *
 * ### Read/write model
 * - `get` reads from memory first, then cache adapters, then persistent adapters,
 *   promoting whatever it finds back up to the faster tiers.
 * - `set`/`remove` update memory + cache adapters synchronously, and only mark
 *   persistent adapters as "dirty" — the actual persistent write happens on
 *   {@link triggerSave} (manual or via the auto-save timer).
 *
 * ### History / undo
 * History is **off by default**. Passing a `history` option to the
 * constructor (with a dedicated persistent adapter) turns it on: every
 * `set`/`remove` call then appends a {@link HistoryEntry} capturing the
 * pre-mutation state of the key, capped at `history.size` entries. That
 * dedicated adapter is never pulled from the main `adapters` list — history
 * storage is fully separate from regular key storage.
 */
@injectable()
export default class Storage {
	/** Default max size of {@link historyArray} when `history.size` isn't provided in options. */
	private static readonly DEFAULT_HISTORY_SIZE = 50;
	/** Reserved storage key used to persist the undo history itself. */
	private static readonly HISTORY_STORAGE_KEY = '__storage_history__';

	private fastestMemoryCache = new Map<string, any>();
	private dirtyKeys = new Set<string>();
	private deletedKeys = new Set<string>();

	private cacheAdapters: StorageAdapter[];
	private persistentAdapters: StorageAdapter[];
	private timerId?: ReturnType<typeof setInterval>;

	private options: StorageOptions;

	/** Bounded LIFO stack of recent mutations, most-recent last. Empty/unused when history is disabled. */
	private historyArray: HistoryEntry[] = [];
	/** Max number of entries {@link historyArray} may hold before the oldest is evicted. */
	private historySize: number;
	/** Whether the undo history feature is turned on (i.e. a valid `history.adapter` was provided and available). */
	private historyEnabled: boolean;
	/** The dedicated persistent adapter used solely for history, when enabled. Never shared with `persistentAdapters`. */
	private historyAdapter?: StorageAdapter;
	/** Ensures the persisted history is only loaded from disk once, lazily, on first use. */
	private historyLoaded = false;

	constructor(options: StorageOptions) {
		this.options = options;

		const availableAdapters = options.adapters.filter(adapter => adapter.isAvailable());

		this.cacheAdapters = availableAdapters.filter(a => a.role === 'cache');
		this.persistentAdapters = availableAdapters.filter(a => a.role === 'persistent');

		this.historySize = options.history?.size ?? Storage.DEFAULT_HISTORY_SIZE;
		this.historyAdapter = undefined;
		this.historyEnabled = false;

		if (options.history) {
			if (options.history.adapter.role !== 'persistent') {
				throw new Error('Storage: history.adapter must have role "persistent" (no cache adapter is used for history).');
			}
			if (options.history.adapter.isAvailable()) {
				this.historyAdapter = options.history.adapter;
				this.historyEnabled = true;
			}
		}

		if (options.saveMinutesInterval && options.saveMinutesInterval > 0) {
			this.timerId = setInterval(() => {
				this.triggerSave();
			}, options.saveMinutesInterval * 60 * 1000);
		}
	}

	/**
	 * Stops the auto-save interval if running. Does not flush pending writes —
	 * call {@link triggerSave} first if you need that.
	 */
	destroy() {
		if (this.timerId) {
			clearInterval(this.timerId);
		}
	}

	/**
	 * Reads a value, checking (in order) the in-memory cache, cache adapters,
	 * then persistent adapters. Any value found in a slower tier is promoted
	 * to the faster tiers above it so subsequent reads are cheaper.
	 *
	 * @returns the stored value, or `null` if the key isn't found anywhere.
	 */
	async get<T>(key: string): Promise<T | null> {
		// 1. Check in-memory cache
		if (this.fastestMemoryCache.has(key)) {
			return this.fastestMemoryCache.get(key) as T;
		}

		// 2. Check cache adapters (e.g. LocalStorage)
		for (const adapter of this.cacheAdapters) {
			const value = await adapter.get<T>(key);
			if (value !== null && value !== undefined) {
				this.fastestMemoryCache.set(key, value);
				return value;
			}
		}

		// 3. Check persistent adapters (e.g. JSON file)
		for (const adapter of this.persistentAdapters) {
			const value = await adapter.get<T>(key);
			if (value !== null && value !== undefined) {
				this.fastestMemoryCache.set(key, value);
				// Sync back to cache layer for faster future reads
				await Promise.all(this.cacheAdapters.map(a => a.set(key, value)));
				return value;
			}
		}

		return null;
	}

	/**
	 * Writes `value` to memory and all cache adapters instantly, and queues the
	 * key for the next {@link triggerSave} against persistent adapters.
	 *
	 * If history is enabled (see {@link HistoryOptions}), the key's previous
	 * state is recorded first so this change can later be undone with
	 * {@link restoreLastChange}.
	 */
	async set<T>(key: string, value: T): Promise<void> {
		await this.pushHistory(key);

		this.fastestMemoryCache.set(key, value);
		this.deletedKeys.delete(key);
		this.dirtyKeys.add(key);

		// Instantly write to cache layers (browser)
		await Promise.all(this.cacheAdapters.map(adapter => adapter.set(key, value)));
	}

	/**
	 * Removes `key` from memory and all cache adapters instantly, and queues
	 * the deletion for the next {@link triggerSave} against persistent adapters.
	 *
	 * If history is enabled (see {@link HistoryOptions}), the key's previous
	 * state is recorded first so this change can later be undone with
	 * {@link restoreLastChange}.
	 */
	async remove(key: string): Promise<void> {
		await this.pushHistory(key);

		this.fastestMemoryCache.delete(key);
		this.dirtyKeys.delete(key);
		this.deletedKeys.add(key);

		// Instantly remove from cache layers
		await Promise.all(this.cacheAdapters.map(adapter => adapter.remove(key)));
	}

	/**
	 * Flushes all pending writes and deletions to every persistent adapter.
	 * No-ops if there are no persistent adapters or nothing is dirty.
	 */
	async triggerSave(): Promise<void> {
		if (this.persistentAdapters.length === 0) return;
		if (this.dirtyKeys.size === 0 && this.deletedKeys.size === 0) return;

		const writes = Array.from(this.dirtyKeys).map(async (key) => {
			const val = this.fastestMemoryCache.get(key);
			await Promise.all(this.persistentAdapters.map(adapter => adapter.set(key, val)));
		});

		const deletions = Array.from(this.deletedKeys).map(async (key) => {
			await Promise.all(this.persistentAdapters.map(adapter => adapter.remove(key)));
		});

		await Promise.all([...writes, ...deletions]);

		this.dirtyKeys.clear();
		this.deletedKeys.clear();
	}

	/**
	 * Undoes the most recent `set`/`remove` mutation by restoring the key to
	 * whatever state it held immediately beforehand.
	 *
	 * - If the key didn't exist before that mutation, it is removed.
	 * - If it did exist, its previous value is written back.
	 *
	 * The undo operation itself is *not* pushed onto the history stack, so
	 * calling this repeatedly walks further back in time rather than
	 * bouncing between two states.
	 *
	 * @returns `true` if a change was reverted, `false` if history is disabled
	 * or there was nothing left to undo.
	 */
	async restoreLastChange(): Promise<boolean> {
		if (!this.historyEnabled) {
			return false;
		}

		await this.loadHistoryIfNeeded();

		const lastEntry = this.historyArray.pop();
		if (!lastEntry) {
			return false;
		}

		const { key, previousValue, hadValue } = lastEntry;

		if (hadValue) {
			this.fastestMemoryCache.set(key, previousValue);
			this.deletedKeys.delete(key);
			this.dirtyKeys.add(key);
			await Promise.all(this.cacheAdapters.map(adapter => adapter.set(key, previousValue)));
		} else {
			this.fastestMemoryCache.delete(key);
			this.dirtyKeys.delete(key);
			this.deletedKeys.add(key);
			await Promise.all(this.cacheAdapters.map(adapter => adapter.remove(key)));
		}

		await this.persistHistory();
		return true;
	}

	/**
	 * Turns the auto-save timer on or off at runtime.
	 *
	 * - `"turn off"` clears the current timer, if any, leaving pending writes
	 *   untouched (call {@link triggerSave} manually if you need to flush).
	 * - `"turn on"` (re)starts the timer using `saveMinutesInterval` from the
	 *   constructor options if one was set, otherwise falling back to
	 *   {@link Storage.SAVE_MINUTES_INTERVAL} (3 minutes). Any
	 *   previously running timer is cleared first to avoid duplicates.
	 */
	configureAutoSave(com: 'turn on' | 'turn off'): void {
		if (this.timerId) {
			clearInterval(this.timerId);
			this.timerId = undefined;
		}

		if (com === 'turn off') {
			return;
		}

		// com === 'turn on'
		const intervalMinutes = this.options.saveMinutesInterval && this.options.saveMinutesInterval > 0
			? this.options.saveMinutesInterval : 3; //By default 5

		this.options.saveMinutesInterval = intervalMinutes;

		this.timerId = setInterval(() => {
			this.triggerSave();
		}, intervalMinutes * 60 * 1000);
	}

  configureAutoSaveMinutesTime(newMinutes:number):void {
    if (newMinutes <= 0) throw new Error(`Storage.ts: Can't set autoSaveMinutesTime with value: '${newMinutes}'. Value no valid`)
    this.configureAutoSave("turn off");
    this.options.saveMinutesInterval = newMinutes;
    this.configureAutoSave("turn on");
  }

	/**
	 * Records the pre-mutation state of `key` into {@link historyArray},
	 * evicting the oldest entry if `historySize` is exceeded, then persists
	 * the updated history array. No-ops entirely when history is disabled.
	 */
	private async pushHistory(key: string): Promise<void> {
		if (!this.historyEnabled) {
			return;
		}

		await this.loadHistoryIfNeeded();

		const hadValue = this.fastestMemoryCache.has(key);
		const previousValue = hadValue ? this.fastestMemoryCache.get(key) : null;

		this.historyArray.push({
			key,
			previousValue,
			hadValue,
			timestamp: Date.now(),
		});

		if (this.historyArray.length > this.historySize) {
			this.historyArray.shift();
		}

		await this.persistHistory();
	}

	/**
	 * Serializes {@link historyArray} to the dedicated {@link historyAdapter}.
	 * This adapter is exclusively for history — it's never one of the
	 * adapters used for regular keys, so history storage can't collide with
	 * or "steal" from the main `adapters` configuration. No-ops when history
	 * is disabled.
	 */
	private async persistHistory(): Promise<void> {
		if (!this.historyEnabled || !this.historyAdapter) {
			return;
		}

		await this.historyAdapter.set(Storage.HISTORY_STORAGE_KEY, this.historyArray);
	}

	/**
	 * Lazily restores {@link historyArray} from the dedicated history adapter
	 * the first time it's needed (rather than in the constructor, since
	 * construction is sync). No-ops when history is disabled.
	 */
	private async loadHistoryIfNeeded(): Promise<void> {
		if (this.historyLoaded) return;
		this.historyLoaded = true;

		if (!this.historyEnabled || !this.historyAdapter) {
			return;
		}

		const stored = await this.historyAdapter.get<HistoryEntry[]>(Storage.HISTORY_STORAGE_KEY);
		if (stored) {
			this.historyArray = stored;
		}
	}
}