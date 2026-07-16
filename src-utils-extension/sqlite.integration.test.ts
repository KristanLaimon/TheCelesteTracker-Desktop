import { beforeAll, describe, expect, test } from 'bun:test';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ServerWebSocket } from 'bun';
import { $ } from 'bun';

const ROOT = join(import.meta.dir, '..');
const platform = process.platform;

// Determine Go binary name based on platform
let binaryName = 'utilities-win_x64.exe';
if (platform === 'linux') {
	binaryName = 'utilities-linux_x64';
} else if (platform === 'darwin') {
	binaryName = 'utilities-mac_x64';
}

const EXT_PATH = join(ROOT, 'extensions', 'utilities', binaryName);
const DB_PATH = 'TheCelesteTrackerTestDb.db';

interface SqlResult {
	success: boolean;
	rows?: Record<string, string | number | null>[];
	error?: string;
}

interface ExtensionWSResponse {
	method: string;
	data?: {
		event: string;
		data: {
			reqId: string;
			result: SqlResult;
		};
	};
}

describe('SQLite via Go Utilities Extension — Integration Tests', () => {
	beforeAll(async () => {
		// Verify if binary exists, if not build it
		if (!existsSync(EXT_PATH)) {
			console.log(`\n  Utilities Extension binary not found at: ${EXT_PATH}`);
			console.log('🛠️ Building Go extension first...');
			await $`bun run build`.cwd(ROOT);
		}
		expect(existsSync(EXT_PATH)).toBe(true);
	});

	test('Should successfully execute SQL query and return rows', async () => {
		const reqId = 'test-query-success';
		const sql = 'SELECT sqlite_version() AS version;';

		const result = await runExtensionQuery(sql, reqId);

		expect(result.success).toBe(true);
		expect(result.rows).toBeArray();
		expect(result.rows?.length).toBeGreaterThan(0);
		expect(result.rows?.[0].version).toBeString();
	});

	test('Should handle SQL errors gracefully', async () => {
		const reqId = 'test-query-error';
		const sql = 'SELECT * FROM non_existent_table_xyz;';

		const result = await runExtensionQuery(sql, reqId);

		expect(result.success).toBe(false);
		expect(result.error).toBeString();
		expect(result.error).toContain('no such table');
	});
});

// Helper to run query via WebSocket connection to the Go extension
function runExtensionQuery(sql: string, reqId: string): Promise<SqlResult> {
	return new Promise((resolve, reject) => {
		let extensionProcess: ChildProcess | null = null;
		let wsConnection: ServerWebSocket<unknown> | null = null;
		let queryResolved = false;

		const server = Bun.serve({
			port: 0, // ephemeral port
			fetch(req, server) {
				if (server.upgrade(req, { data: undefined })) return;
				return new Response('Upgrade failed', { status: 400 });
			},
			websocket: {
				open(ws: ServerWebSocket<unknown>) {
					wsConnection = ws;
					// Send the query
					ws.send(
						JSON.stringify({
							event: 'executeSql',
							data: { reqId, db: DB_PATH, sql },
						}),
					);
				},
				message(_ws, message) {
					try {
						const response = JSON.parse(message as string) as ExtensionWSResponse;
						if (response.method === 'app.broadcast' && response.data?.event === 'sqlResult') {
							const payload = response.data.data;
							if (payload.reqId === reqId) {
								queryResolved = true;
								resolve(payload.result);
							}
						}
					} catch (e) {
						reject(e);
					}
					cleanup();
				},
				close() {
					if (!queryResolved) {
						reject(new Error('Connection closed before query was resolved'));
					}
				},
			},
		});

		const PORT = server.port;

		try {
			extensionProcess = spawn(EXT_PATH, [], {
				stdio: ['pipe', 'ignore', 'ignore'],
			});

			extensionProcess.on('error', (err: Error) => {
				cleanup();
				reject(err);
			});

			// Feed config to stdin
			const config = {
				nlPort: String(PORT),
				nlToken: 'mock-token',
				nlExtensionId: 'utilities',
				nlConnectToken: 'mock-connect-token',
			};
			if (extensionProcess.stdin) {
				extensionProcess.stdin.write(`${JSON.stringify(config)}\n`);
			}
		} catch (err) {
			cleanup();
			reject(err);
		}

		// Timeout safeguard
		const timeout = setTimeout(() => {
			cleanup();
			reject(new Error('Query timed out after 5 seconds'));
		}, 5000);

		function cleanup() {
			clearTimeout(timeout);
			if (wsConnection) wsConnection.close();
			if (extensionProcess) extensionProcess.kill();
			server.stop();
		}
	});
}
