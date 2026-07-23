// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: DI Needed
/** biome-ignore-all lint/complexity/noBannedTypes: No need for more explicit function signatures */
import { injectable } from "tsyringe";
import type { IFileSystem } from "../src/interfaces/IFileSystem";
import type { IOS } from "../src/interfaces/IOs";
import type { IPath } from "../src/interfaces/IPath";
import { Log_Info, Log_Throw } from "../src/libs/Logger";
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

	private async executeInternal<R>(sql: string): Promise<R> {
		const utilityExecutable = await this.GetExecutablePath();
		const cmd = `"${utilityExecutable}" sqlite --db "${this.dbPath}"`;

		Log_Info(`Sqlite CLI Executing: ${cmd}`);
		const response = await this.os.execCommand(cmd, { stdIn: sql });

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
	 * Runs a SQL query that returns rows (e.g. SELECT).
	 */
	public async Query<T>(sql: string): Promise<SQLiteQueryResult<T>> {
		return await this.executeInternal<SQLiteQueryResult<T>>(sql);
	}

	/**
	 * Executes a SQL statement that does not return rows (e.g. INSERT, UPDATE, DELETE).
	 */
	public async Exec(sql: string): Promise<SqliteExecResult> {
		return await this.executeInternal<SqliteExecResult>(sql);
	}
}
