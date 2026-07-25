// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: DI Needed
/** biome-ignore-all lint/complexity/noBannedTypes: No need for more explicit function signatures */

import { injectable } from "tsyringe";
import type { IFileSystem } from "../src/core/interfaces/IFileSystem";
import type { IOS } from "../src/core/interfaces/IOs";
import type { IPath } from "../src/core/interfaces/IPath";
import { Log_Info, Log_Throw } from "../src/utils/Logger";
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
	private dbPath: string;

	public constructor(dbPath: string, os: IOS, fs: IFileSystem, path: IPath) {
		super(os, fs, path);
		this.dbPath = dbPath;
		fs.exists(this.dbPath).then((exists) => {
			if (!exists) {
				Log_Throw(`Database DOESN'T EXIST!, not found. Should be in '${this.dbPath}'. Creating a new empty database as default...`);
			}
		});
	}

	private async executeInternal<R>(stdIn: string): Promise<R> {
		const utilityExecutable = await this.GetExecutablePath();
		const cmd = `"${utilityExecutable}" sqlite --db "${this.dbPath}"`;

		Log_Info(`Sqlite CLI Executing: ${cmd}`);
		const response = await this.os.execCommand(cmd, { stdIn });

		if (response.exitCode !== 0) {
			try {
				const parsed = JSON.parse(response.stdOut);
				if (parsed && typeof parsed === "object" && "success" in parsed && !parsed.success) {
					throw new Error(parsed.error || "Database operation failed");
				}
			} catch {}
			throw new Error(response.stdErr || `SQLite helper exited with code ${response.exitCode}`);
		}

		const parsed = JSON.parse(response.stdOut);
		if (!parsed.success) {
			throw new Error(parsed.error || "Database operation failed");
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
