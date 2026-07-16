import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'bun';

const ROOT = join(import.meta.dir, '..');
const platform = process.platform;

// Determine Neutralino binary path
let neuBinary = 'neutralino-win_x64.exe';
if (platform === 'linux') {
	neuBinary = 'neutralino-linux_x64';
} else if (platform === 'darwin') {
	neuBinary = 'neutralino-mac_x64';
}
const NEU_PATH = join(ROOT, 'bin', neuBinary);
const AUTH_INFO_PATH = join(ROOT, '.tmp', 'auth_info.json');
const DB_PATH = 'TheCelesteTrackerTestDb.db';

interface NeutralinoAuthInfo {
	nlPort: number | string;
	nlConnectToken: string;
	nlToken: string;
}

interface SqlResult {
	success: boolean;
	rows?: Record<string, string | number | null>[];
	error?: string;
}

interface NeutralinoWSResponse {
	event: string;
	data: {
		reqId: string;
		result: SqlResult;
	};
}

describe('Real Neutralino Integration Tests', () => {
	let neuProcess: ChildProcess | null = null;
	let wsClient: WebSocket | null = null;
	let authInfo: NeutralinoAuthInfo | null = null;

	beforeAll(async () => {
		// Wait 1 second to ensure OS releases ports from any concurrent or previous runs
		await new Promise((r) => setTimeout(r, 1000));

		// 1. Ensure the SQLite extension binary is built
		const extBinary = platform === 'win32' ? 'sqlite-win_x64.exe' : 'sqlite-linux_x64';
		const extPath = join(ROOT, 'extensions', 'sqlite', extBinary);
		if (!existsSync(extPath)) {
			console.log('  Building extension binary first...');
			await $`bun run build:extension`.cwd(ROOT);
		}

		// 2. Clean up any stale auth info
		if (existsSync(AUTH_INFO_PATH)) {
			rmSync(AUTH_INFO_PATH, { force: true });
		}

		// 3. Start Neutralino Server in hidden window mode
		console.log(`  Starting real Neutralino server from: ${NEU_PATH}`);
		neuProcess = spawn(
			NEU_PATH,
			[
				'--load-dir-res',
				'--path=.',
				'--export-auth-info',
				'--neu-dev-extension',
				'--window-hidden', // Start window hidden to avoid popping up GUI during tests
				'--port=0',
			],
			{
				cwd: ROOT,
				stdio: ['ignore', 'ignore', 'ignore'], // Keep logs clean
			},
		);

		// 4. Wait for auth_info.json to be exported
		console.log('⏳ Waiting for Neutralino to export auth details...');
		let attempts = 0;
		while (!existsSync(AUTH_INFO_PATH) && attempts < 30) {
			await new Promise((r) => setTimeout(r, 200));
			attempts++;
		}

		if (!existsSync(AUTH_INFO_PATH)) {
			throw new Error('Timeout waiting for Neutralino to start and export auth_info.json');
		}

		// 5. Parse auth details
		authInfo = JSON.parse(readFileSync(AUTH_INFO_PATH, 'utf-8')) as NeutralinoAuthInfo;
		console.log(`🔌 Neutralino server started on port ${authInfo.nlPort}`);
	});

	afterAll(() => {
		console.log('  Cleaning up real Neutralino test process...');
		if (wsClient) {
			wsClient.close();
		}
		if (neuProcess) {
			neuProcess.kill();
		}
		if (existsSync(AUTH_INFO_PATH)) {
			rmSync(AUTH_INFO_PATH, { force: true });
		}
	});

	test('Should communicate with C extension through the real Neutralino server', async () => {
		const reqId = 'real-neu-test-uuid';

		if (!authInfo) {
			throw new Error('Neutralino authInfo was not parsed');
		}

		// Connect WebSocket client to Neutralino server
		const wsUrl = `ws://127.0.0.1:${authInfo.nlPort}/?connectToken=${authInfo.nlConnectToken}`;

		const result = await new Promise<SqlResult>((resolve, reject) => {
			wsClient = new WebSocket(wsUrl);

			wsClient.onopen = () => {
				console.log('  WebSocket client connected to Neutralino server');
				// Send the dispatch command through Neutralino's method routing
				const dispatchPayload = {
					id: crypto.randomUUID(),
					method: 'extensions.dispatch',
					accessToken: authInfo?.nlToken,
					data: {
						extensionId: 'sqlite',
						event: 'executeSql',
						data: {
							reqId: reqId,
							db: DB_PATH,
							sql: 'SELECT sqlite_version() AS version;',
						},
					},
				};
				console.log('  Sending dispatch payload to Neutralino:', JSON.stringify(dispatchPayload));
				wsClient?.send(JSON.stringify(dispatchPayload));
			};

			wsClient.onmessage = (event) => {
				console.log('  Raw WS message received from Neutralino:', event.data);
				try {
					const response = JSON.parse(event.data as string) as NeutralinoWSResponse;
					// Neutralino broadcasts event to all clients
					if (response.event === 'sqlResult') {
						const payload = response.data;
						if (payload.reqId === reqId) {
							console.log('  Match found! Resolving test promise.');
							resolve(payload.result);
						}
					}
				} catch (err) {
					console.error('  Error parsing WS message:', err);
					reject(err);
				}
			};

			wsClient.onerror = (err) => {
				reject(err);
			};

			// 5-second timeout
			setTimeout(() => {
				reject(new Error('Real Neutralino integration test timed out'));
			}, 5000);
		});

		expect(result.success).toBe(true);
		expect(result.rows).toBeArray();
		expect(result.rows?.length).toBeGreaterThan(0);
		expect(result.rows?.[0].version).toBeString();
		console.log(` Real Neutralino query result verified: SQLite Version ${result.rows?.[0].version}`);
	});
});
