import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ServerWebSocket } from 'bun';

interface DirectTestOptions {
	binaryName: string; // e.g. "utilities-win_x64.exe"
	extensionId: string; // e.g. "utilities"
	requestEvent: string; // e.g. "zip.list"
	requestData: Record<string, unknown>;
	responseEvent: string; // e.g. "zip.listResult"
}

interface ExtensionResponse {
	method: string;
	data?: {
		event: string;
		data: unknown;
	};
}

export function runDirectExtensionTest<T = unknown>(options: DirectTestOptions): Promise<T> {
	return new Promise((resolve, reject) => {
		const root = join(import.meta.dir, '../..');
		const extPath = join(root, 'extensions', options.extensionId, options.binaryName);

		if (!existsSync(extPath)) {
			return reject(new Error(`Extension binary not found at: ${extPath}`));
		}

		let extProcess: ChildProcess | null = null;
		let wsConnection: ServerWebSocket<unknown> | null = null;
		let isResolved = false;

		const server = Bun.serve({
			port: 0,
			fetch(req, server) {
				if (server.upgrade(req, { data: undefined })) return;
				return new Response('WebSocket upgrade failed', { status: 400 });
			},
			websocket: {
				open(ws: ServerWebSocket<unknown>) {
					wsConnection = ws;
					// Send test request once client connects
					ws.send(
						JSON.stringify({
							event: options.requestEvent,
							data: options.requestData,
						}),
					);
				},
				message(_ws, message) {
					try {
						const response = JSON.parse(message as string) as ExtensionResponse;
						if (response.method === 'app.broadcast' && response.data?.event === options.responseEvent) {
							isResolved = true;
							resolve(response.data.data as T);
							cleanup();
						}
					} catch (e) {
						reject(e);
						cleanup();
					}
				},
				close() {
					if (!isResolved) {
						reject(new Error('WebSocket closed before request resolved'));
					}
				},
			},
		});

		try {
			extProcess = spawn(extPath, [], { stdio: ['pipe', 'ignore', 'ignore'] });

			extProcess.on('error', (err: Error) => {
				cleanup();
				reject(err);
			});

			const config = {
				nlPort: String(server.port),
				nlToken: 'test-token',
				nlExtensionId: options.extensionId,
				nlConnectToken: 'test-connect-token',
			};
			if (extProcess.stdin) {
				extProcess.stdin.write(`${JSON.stringify(config)}\n`);
			}
		} catch (err) {
			cleanup();
			reject(err);
		}

		const timeout = setTimeout(() => {
			cleanup();
			reject(new Error('Extension direct test timed out after 5 seconds'));
		}, 5000);

		function cleanup() {
			clearTimeout(timeout);
			if (wsConnection) wsConnection.close();
			if (extProcess) extProcess.kill();
			server.stop();
		}
	});
}
