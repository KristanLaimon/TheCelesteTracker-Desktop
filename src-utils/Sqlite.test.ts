/** biome-ignore-all lint/complexity/noBannedTypes: Function is ok, we're just using it here */
/** biome-ignore-all lint/suspicious/noExplicitAny: These are tests-only files, no need to be that strict */
/** biome-ignore-all assist/source/organizeImports: To mock before important imports  */
import 'reflect-metadata';

import { describe, expect, mock, test } from 'bun:test';

// Define window mock on globalThis before any modules are evaluated
(globalThis as any).window = {
	location: { href: 'http://localhost:5173', hostname: 'localhost' },
	addEventListener: () => {},
	removeEventListener: () => {},
	dispatchEvent: () => {},
	CustomEvent: class {},
	NL_OS: 'Windows',
	NL_PATH: 'C:/mock-path',
};

let execCommandMock = async (_cmd: string, _options?: any) => {
	return {
		exitCode: 0,
		stdOut: JSON.stringify({
			success: true,
			rows: [{ version: '3.53.3' }],
			changes: 0,
			lastInsertRowId: 0,
		}),
		stdErr: '',
	};
};

// 1. Mock @neutralinojs/lib BEFORE importing the target class
mock.module('@neutralinojs/lib', () => ({
	os: {
		execCommand: (cmd: string, options?: any) => execCommandMock(cmd, options),
	},
	filesystem: {
		getStats: async (_path: string) => ({
			size: 100,
			isFile: true,
			isDirectory: false,
			createdAt: 0,
			modifiedAt: 0,
		}),
	},
	server: {
		getMounts: async () => ({}),
		mount: async () => {},
	},
	events: {
		on: () => {},
	},
	extensions: {
		dispatch: async () => {},
	},
}));

// 2. Import the SQLiteExtension class using require to preserve mock execution order
const { get } = await import('../src/libs/DI');
const { SQLiteExtension } = await import('../src-utils/Sqlite');

describe('SQLiteExtension TS Wrapper Unit Tests', () => {
	test('should successfully run query and resolve the promise', async () => {
		const db = get(SQLiteExtension);

		const res = await db.Query<{ version: string }>('SELECT sqlite_version();');

		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.rows).toBeArray();
			expect(res.rows?.[0].version).toBe('3.53.3');
		}
	});

	test('should successfully run exec and resolve the promise', async () => {
		const db = get(SQLiteExtension);

		const res = await db.Exec('INSERT INTO my_table VALUES(1);');

		expect(res.success).toBe(true);
		if (res.success) {
			expect(res.changes).toBe(0);
		}
	});

	test('should handle error rejection when query fails', async () => {
		// Override execCommandMock to simulate query failure
		execCommandMock = async (_cmd: string, _options?: any) => {
			return {
				exitCode: 0,
				stdOut: JSON.stringify({
					success: false,
					error: 'no such table: missing_table',
				}),
				stdErr: '',
			};
		};

		const db = get(SQLiteExtension);

		try {
			await db.Query('SELECT * FROM missing_table;');
			//@ts-expect-error Made on purpose to force an exception, should never reach here
			expect().unreachable(); // Should not reach here
		} catch (error: any) {
			expect(error.message).toBe('no such table: missing_table');
		}
	});
});
