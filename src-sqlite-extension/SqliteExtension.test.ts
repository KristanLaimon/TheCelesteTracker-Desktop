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
};

// 1. Mock @neutralinojs/lib BEFORE importing the target class
const mockHandlers = new Map<string, Function>();
mock.module('@neutralinojs/lib', () => ({
	events: {
		on: (event: string, handler: Function) => {
			mockHandlers.set(event, handler);
			return Promise.resolve({ success: true, message: 'Listener registered' });
		},
	},
	extensions: {
		dispatch: async (_extId: string, _event: string, data: any) => {
			// Simulate the SQLite C extension returning the data asynchronously
			setTimeout(() => {
				const handler = mockHandlers.get('sqlResult');
				if (handler) {
					// Simulate the CustomEvent structure dispatched by Neutralino client
					const customEventMock = {
						detail: {
							reqId: data.reqId,
							result: {
								success: true,
								rows: [{ version: '3.53.3' }],
								changes: 0,
								lastInsertRowId: 0,
							},
						},
					};
					handler(customEventMock);
				}
			}, 20);
			return Promise.resolve({ success: true, message: 'Dispatched' });
		},
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
}));

// 2. Import the SQLiteExtension class using require to preserve mock execution order
const { get } = await import('../src/libs/DI');
const { SQLiteExtension } = await import('./CSqliteExtension');

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
		// Override dispatch mock to simulate query failure
		mock.module('@neutralinojs/lib', () => ({
			events: {
				on: (event: string, handler: Function) => {
					mockHandlers.set(event, handler);
					return Promise.resolve({ success: true, message: 'Listener registered' });
				},
			},
			extensions: {
				dispatch: async (_extId: string, _event: string, data: any) => {
					setTimeout(() => {
						const handler = mockHandlers.get('sqlResult');
						if (handler) {
							const customEventMock = {
								detail: {
									reqId: data.reqId,
									result: {
										success: false,
										error: 'no such table: missing_table',
									},
								},
							};
							handler(customEventMock);
						}
					}, 20);
					return Promise.resolve({ success: true, message: 'Dispatched' });
				},
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
		}));

		const db = get(SQLiteExtension);

		try {
			await db.Query('SELECT * FROM missing_table;');
			//@ts-expect-error Made on purpose to forze an exception, should never reach here
			expect().unreachable(); // Should not reach here //expected error
		} catch (error: any) {
			expect(error.message).toBe('no such table: missing_table');
		}
	});
});
