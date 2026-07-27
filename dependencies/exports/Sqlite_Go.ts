// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: DI Needed
/** biome-ignore-all lint/complexity/noBannedTypes: No need for more explicit function signatures */

import { injectable } from "tsyringe";
import type { IFileSystem } from "../../src/core/interfaces/IFileSystem";
import type { IOS } from "../../src/core/interfaces/IOs";
import type { IPath } from "../../src/core/interfaces/IPath";
import { dbLogger } from "../../src/utils/Logger";
import Generic_Go from "./Generic_Go";

export type SQLiteQueryResult<T> =
	| {
			success: true;
			rows: T[];
	  }
	| {
			success: false;
			error: string;
	  };

export type SqliteExecuteResult<T> = {
	rows: T[];
	changes: number;
	lastInsertRowId: number;
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

function normalizeParameter(value: unknown): string | number | null {
	if (value === null || value === undefined) return null;
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "boolean") return value ? 1 : 0;
	if (typeof value === "bigint") return Number(value);
	if (typeof value === "string" || typeof value === "number") return value;
	throw new Error(`Sqlite_Go: unsupported SQL parameter type '${typeof value}'. Only primitives, Date and null are bindable.`);
}

@injectable()
export default class Sqlite_Go extends Generic_Go {
	#dbPath: string;
	#dbExists: boolean;
	public get IsDatabaseAvailable(): boolean {
		return this.#dbExists;
	}

	public constructor(dbPath: string, os: IOS, fs: IFileSystem, path: IPath) {
		super(os, fs, path);
		this.#dbPath = dbPath;
		this.#dbExists = false;
		fs.exists(this.#dbPath).then((exists) => {
			this.#dbExists = exists;
			if (!exists) {
				const errMsg = `Database DOESN'T EXIST!, not found. Should be in '${this.#dbPath}'. Creating a new empty database just to avoid crash... (setting isDatabaseAvailable as false)`;
				dbLogger.fatal(errMsg);
				throw new Error(errMsg);
			}
		});
	}

	private async executeInternal<R>(stdIn: string): Promise<R> {
		const utilityExecutable = await this.GetExecutablePath("Sqlite");
		const cmd = `"${utilityExecutable}" --db "${this.#dbPath}"`;

		dbLogger.info(`Sqlite CLI Executing: ${cmd}`);
		const response = await this.os.execCommand(cmd, { stdIn });

		let parsed: { success?: boolean; error?: string; [key: string]: unknown } | undefined;
		if (response.stdOut?.trim()) {
			try {
				parsed = JSON.parse(response.stdOut.trim());
			} catch {
				// stdOut was not valid JSON
			}
		}

		if (response.exitCode !== 0) {
			const jsonError = parsed && typeof parsed === "object" && typeof parsed.error === "string" && parsed.error ? parsed.error : null;
			const detail = jsonError || response.stdErr?.trim() || response.stdOut?.trim() || `exit code ${response.exitCode}`;
			const errMsg = `Sqlite_Go failed: ${detail}`;
			dbLogger.error(errMsg);
			throw new Error(errMsg);
		}

		if (!parsed) {
			const errMsg = `Sqlite_Go failed to parse helper response JSON. Raw stdout: "${response.stdOut}"`;
			dbLogger.error(errMsg);
			throw new Error(errMsg);
		}

		if (!parsed.success) {
			const errMsg = `Sqlite_Go database operation failed: ${parsed.error || "Unknown error"}`;
			dbLogger.error(errMsg);
			throw new Error(errMsg);
		}
		return parsed as R;
	}

	/**
	 * Runs any SQL statement with bound parameters (`?` placeholders), the transport Kysely's dialect uses.
	 * Values are bound by the SQLite driver, never interpolated into the SQL string.
	 * @throws If a parameter is not a primitive, or if the statement fails.
	 */
	public async Execute<T>(sql: string, parameters: readonly unknown[] = []): Promise<SqliteExecuteResult<T>> {
		const payload = JSON.stringify({ sql, params: parameters.map(normalizeParameter) });
		const res = await this.executeInternal<{ rows?: T[]; changes: number; lastInsertRowId: number }>(payload);
		return { rows: res.rows ?? [], changes: res.changes, lastInsertRowId: res.lastInsertRowId };
	}

	/**
	 * Runs a SQL query that returns rows (e.g. SELECT).
	 */
	public async Query<T>(sql: string, parameters: readonly unknown[] = []): Promise<SQLiteQueryResult<T>> {
		const res = await this.Execute<T>(sql, parameters);
		return { success: true, rows: res.rows };
	}

	/**
	 * Executes a SQL statement that does not return rows (e.g. INSERT, UPDATE, DELETE).
	 */
	public async Exec(sql: string, parameters: readonly unknown[] = []): Promise<SqliteExecResult> {
		const res = await this.Execute(sql, parameters);
		return { success: true, changes: res.changes, lastInsertRowId: res.lastInsertRowId };
	}
}
