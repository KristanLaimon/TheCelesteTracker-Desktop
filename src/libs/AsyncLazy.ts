// UNIVERSAL COMPATIBILITY

export type AsyncLazyInitOptions = {
	/**
	 * If true (default), resets cached promise on rejection so subsequent calls retry.
	 */
	resetOnError?: boolean;
};

export type AsyncLazyGetOptions = {
	/**
	 * If true, discards any existing cached promise and forces a new execution of the factory function.
	 */
	forceRefresh?: boolean;
};

/**
 * Encapsulates a lazily-evaluated asynchronous value with in-flight request coalescing, caching, and argument forwarding.
 * - 1st call executes the factory function with provided arguments.
 * - Concurrent calls (2..N) share the exact same Promise instance and resolve together.
 * - Resolved Promise is retained for instant subsequent reads.
 * - Forwards arguments (e.g. `opts?: LocalModsOptions`) to factory function on execution.
 */
export class AsyncLazy<T, TArgs = void> {
	#promise: Promise<T> | null = null;
	#isFulfilled = false;

	constructor(
		private readonly factory: (args?: TArgs) => Promise<T>,
		private readonly initOptions: AsyncLazyInitOptions = { resetOnError: true },
	) {}

	public get(args?: TArgs, opts?: AsyncLazyGetOptions): Promise<T>;
	public get(opts?: AsyncLazyGetOptions): Promise<T>;
	public get(argsOrOpts?: TArgs | AsyncLazyGetOptions, opts?: AsyncLazyGetOptions): Promise<T> {
		let args: TArgs | undefined;
		let options: AsyncLazyGetOptions | undefined;

		if (argsOrOpts && typeof argsOrOpts === "object" && "forceRefresh" in argsOrOpts && opts === undefined) {
			options = argsOrOpts as AsyncLazyGetOptions;
		} else {
			args = argsOrOpts as TArgs;
			options = opts;
		}

		if (!this.#promise || options?.forceRefresh) {
			this.#isFulfilled = false;
			this.#promise = this.factory(args)
				.then((res) => {
					this.#isFulfilled = true;
					return res;
				})
				.catch((err) => {
					if (this.initOptions.resetOnError !== false) {
						this.#promise = null;
						this.#isFulfilled = false;
					}
					throw err;
				});
		}
		return this.#promise;
	}

	public reset(): void {
		this.#promise = null;
		this.#isFulfilled = false;
	}

	public isReady(): boolean {
		return this.#isFulfilled;
	}
}
