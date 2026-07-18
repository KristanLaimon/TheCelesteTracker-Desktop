// biome-ignore-all lint/style/useImportType: DI Needed
/** biome-ignore-all lint/complexity/noBannedTypes: No need for more explicit function signatures */
import { events, extensions } from '@neutralinojs/lib';
import { injectable } from 'tsyringe';
import { Log_Info, Log_Throw } from '../src/libs/Logger';
import { NeutralinoFileSystem } from '../src/libs/NeutralinoFileSystem';

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


@injectable()
export class SQLiteExtension {
	private extensionId: string = 'utilities'; // Handled by the unified Go extension
	private dbPath: string;
	private pendingRequests: Map<string /* Request ID */, { resolve: Function; reject: Function }>;

	public constructor(dbPath: string, fs: NeutralinoFileSystem) {
		this.dbPath = dbPath;
		this.pendingRequests = new Map();
		events.on('sqlResult', this.handleExtensionMessage.bind(this));

		fs.exists(this.dbPath).then((exists) => {
			if (!exists) {
				Log_Throw(`Database DOESN'T EXIST!, not found. Should be in '${this.dbPath}'. Creating a new empty database as default...`);
			}
		});
	}

	private handleExtensionMessage(evt: CustomEvent) {
		Log_Info('SqliteExtension: Received window event [sqlResult]', evt);
		let payload = evt.detail; // Neutralino specifics
		Log_Info('SqliteExtension: Raw payload detail:', payload);

		if (typeof payload === 'string') {
			try {
				payload = JSON.parse(payload);
				Log_Info('SqliteExtension: Parsed string payload:', payload);
			} catch (err) {
				console.error('SqliteExtension: Failed to parse payload string:', err);
				return;
			}
		}

		const reqId = payload?.reqId;
		const result = payload?.result;
		Log_Info('SqliteExtension: Extracted reqId:', reqId, 'result:', result);

		if (reqId && this.pendingRequests.has(reqId)) {
			Log_Info(`SqliteExtension: Resolving pending request for reqId [${reqId}]`);
			const promise = this.pendingRequests.get(reqId);

			if (promise) {
				if (result?.success) {
					promise.resolve(result);
				} else {
					promise.reject(new Error(result?.error || 'Unknown SQLite error'));
				}
			}

			this.pendingRequests.delete(reqId);
		} else {
			console.warn(`SqliteExtension: No pending request found for reqId [${reqId}]`, Array.from(this.pendingRequests.keys()));
		}
	}

	private executeInternal<R>(sql: string): Promise<R> {
		return new Promise((resolve, reject) => {
			const reqId = crypto.randomUUID();
			Log_Info(`SqliteExtension: Creating request [${reqId}] for query: ${sql}`);

			this.pendingRequests.set(reqId, { resolve, reject });

			Log_Info(`SqliteExtension: Dispatching query [${reqId}] to extension ${this.extensionId}`);
			extensions
				.dispatch(this.extensionId, 'executeSql', {
					reqId,
					db: this.dbPath,
					sql,
				})
				.then(() => {
					Log_Info(`SqliteExtension: Dispatch resolved for request [${reqId}]`);
				})
				.catch((error) => {
					console.error(`SqliteExtension: Dispatch failed for request [${reqId}]:`, error);
					this.pendingRequests.delete(reqId);
					reject(error);
				});
		});
	}

	/**
	 * Runs a SQL query that returns rows (e.g. SELECT).
	 */
	public Query<T>(sql: string): Promise<SQLiteQueryResult<T>> {
		return this.executeInternal<SQLiteQueryResult<T>>(sql);
	}

	/**
	 * Executes a SQL statement that does not return rows (e.g. INSERT, UPDATE, DELETE).
	 */
	public Exec(sql: string): Promise<SqliteExecResult> {
		return this.executeInternal<SqliteExecResult>(sql);
	}
}
