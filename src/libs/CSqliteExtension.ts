import { events, extensions } from '@neutralinojs/lib';

export type SQLiteQueryResult<T> =
	| {
			success: true;
			rows: T[];
	  }
	| {
			success: false;
			error: string;
	  };

export type SqliteExecResult =
	| {
			success: true;
			changes: number;
			lastInsertRowId: number;
	  }
	| {
			success: false;
			error: string;
	  };

export class SQLiteExtension {
	private extensionId: string = 'sqlite'; //Must be synced with neutralino.configjson extension id
	private dbPath: string;
	private pendingRequests: Map<string /* Request ID */, { resolve: Function; reject: Function }>;
	constructor(dbPath: string) {
		this.dbPath = dbPath;
		this.pendingRequests = new Map();
		events.on('sqlResult', this.handleExtensionMessage.bind(this));
	}
	private handleExtensionMessage(evt: CustomEvent) {
		console.log('CSqliteExtension: Received window event [sqlResult]', evt);
		let payload = evt.detail; //Neutralino specifics
		console.log('CSqliteExtension: Raw payload detail:', payload);

		//C send us back the response as plain text
		if (typeof payload === 'string') {
			try {
				payload = JSON.parse(payload);
				console.log('CSqliteExtension: Parsed string payload:', payload);
			} catch (err) {
				console.error('CSqliteExtension: Failed to parse payload string:', err);
				return;
			}
		}

		const reqId = payload?.reqId;
		const result = payload?.result;
		console.log('SqliteExtension: Extracted reqId:', reqId, 'result:', result);

		if (reqId && this.pendingRequests.has(reqId)) {
			console.log(`CSqliteExtension: Resolving pending request for reqId [${reqId}]`);
			const promise = this.pendingRequests.get(reqId)!;

			if (result?.success) {
				promise.resolve(result);
			} else {
				promise.reject(new Error(result?.error || 'Error desconocido en SQLite'));
			}

			this.pendingRequests.delete(reqId);
		} else {
			console.warn(`CSqliteExtension: No pending request found for reqId [${reqId}]`, Array.from(this.pendingRequests.keys()));
		}
	}

	private executeInternal<R>(sql: string): Promise<R> {
		return new Promise((resolve, reject) => {
			const reqId = crypto.randomUUID();
			console.log(`CSqliteExtension: Creating request [${reqId}] for query: ${sql}`);

			this.pendingRequests.set(reqId, { resolve, reject });

			console.log(`CSqliteExtension: Dispatching query [${reqId}] to extension ${this.extensionId}`);
			extensions
				.dispatch(this.extensionId, 'executeSql', {
					reqId: reqId, // To track the request. Otherwise, weird happens could happen.
					db: this.dbPath,
					sql: sql,
				})
				.then(() => {
					console.log(`CSqliteExtension: Dispatch resolved for request [${reqId}]`);
				})
				.catch((error) => {
					console.error(`CSqliteExtension: Dispatch failed for request [${reqId}]:`, error);
					this.pendingRequests.delete(reqId);
					reject(error);
				});
		});
	}

	/**
	 * Runs a SQL query that returns rows (e.g. SELECT).
	 */
	public query<T>(sql: string): Promise<SQLiteQueryResult<T>> {
		return this.executeInternal<SQLiteQueryResult<T>>(sql);
	}

	/**
	 * Executes a SQL statement that does not return rows (e.g. INSERT, UPDATE, DELETE).
	 */
	public exec(sql: string): Promise<SqliteExecResult> {
		return this.executeInternal<SqliteExecResult>(sql);
	}

	/**
	 * Deprecated: Use query() or exec() instead.
	 */
	public execute<T>(sql: string): Promise<SQLiteQueryResult<T>> {
		return this.executeInternal<SQLiteQueryResult<T>>(sql);
	}
}
