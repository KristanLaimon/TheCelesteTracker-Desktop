// biome-ignore-all lint/style/useImportType: DI Needed
/** biome-ignore-all lint/complexity/noBannedTypes: No need for more explicit function signatures */
import { injectable } from 'tsyringe';
import type { IFileSystem } from '../src/interfaces/IFileSystem';
import { Log_Info, Log_Throw } from '../src/libs/Logger';

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
export default class Sqlite_Go {
	private dbPath: string;

	public constructor(dbPath: string, fs: IFileSystem) {
		this.dbPath = dbPath;

		fs.exists(this.dbPath).then((exists) => {
			if (!exists) {
				Log_Throw(`Database DOESN'T EXIST!, not found. Should be in '${this.dbPath}'. Creating a new empty database as default...`);
			}
		});
	}

	private async executeInternal<R>(sql: string): Promise<R> {
		let binaryName = '';
		if (window.NL_OS === 'Windows') {
			binaryName = 'utilities-win_x64.exe';
		} else if (window.NL_OS === 'Linux') {
			binaryName = 'utilities-linux_x64';
		} else if (window.NL_OS === 'Darwin') {
			binaryName = 'utilities-mac_x64';
		}

		// Helper binary is located directly along the main executable (which is window.NL_PATH)
		const helperPath = `"${window.NL_PATH}/${binaryName}"`;
		const cmd = `${helperPath} sqlite --db "${this.dbPath}"`;

		Log_Info(`Sqlite CLI Executing: ${cmd}`);
		const response = await os.execCommand(cmd, { stdIn: sql });

		if (response.exitCode !== 0) {
			try {
				const parsed = JSON.parse(response.stdOut);
				if (parsed && typeof parsed === 'object' && 'success' in parsed && !parsed.success) {
					throw new Error(parsed.error || 'Database operation failed');
				}
			} catch {}
			throw new Error(response.stdErr || `SQLite helper exited with code ${response.exitCode}`);
		}

		const parsed = JSON.parse(response.stdOut);
		if (!parsed.success) {
			throw new Error(parsed.error || 'Database operation failed');
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
