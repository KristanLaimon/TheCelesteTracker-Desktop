import { describe, expect, mock, test } from 'bun:test';

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
}));

// 2. Import the SQLiteExtension class
import { SQLiteExtension } from '../src/libs/CSqliteExtension';

describe('SQLiteExtension TS Wrapper Unit Tests', () => {
	test('should successfully execute query and resolve the promise', async () => {
		const db = new SQLiteExtension('TheCelesteTrackerTestDb.db');

		const res = await db.execute('SELECT sqlite_version();');

		expect(res.success).toBe(true);
		expect(res.rows).toBeArray();
		expect(res.rows?.[0].version).toBe('3.53.3');
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
		}));

		const db = new SQLiteExtension('TheCelesteTrackerTestDb.db');

		try {
			await db.execute('SELECT * FROM missing_table;');
			expect().unreachable(); // Should not reach here //expected error
		} catch (error: any) {
			expect(error.message).toBe('no such table: missing_table');
		}
	});
});
