import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

interface NeutralinoTestOptions {
	extensionId: string;
	requestEvent: string;
	requestData: Record<string, unknown>;
	responseEvent: string;
}

interface NeutralinoAuthInfo {
	nlPort: number | string;
	nlConnectToken: string;
	nlToken: string;
}

interface NeutralinoWSResponse {
	event: string;
	data: unknown;
}

export function runNeutralinoExtensionTest<T = unknown>(options: NeutralinoTestOptions): Promise<T> {
	return new Promise((resolve, reject) => {
		(async () => {
			// Wait 1 second to ensure OS releases ports from any concurrent or previous runs
			await new Promise((r) => setTimeout(r, 1000));

			const root = join(import.meta.dir, '../..');
			const platform = process.platform;

			let neuBinary = 'neutralino-win_x64.exe';
			if (platform === 'linux') {
				neuBinary = 'neutralino-linux_x64';
			} else if (platform === 'darwin') {
				neuBinary = 'neutralino-mac_x64';
			}

			const neuPath = join(root, 'bin', neuBinary);
			const authInfoPath = join(root, '.tmp', 'auth_info.json');

			if (existsSync(authInfoPath)) {
				rmSync(authInfoPath, { force: true });
			}

			let neuProcess: ChildProcess | null = null;
			let wsClient: WebSocket | null = null;

			try {
				neuProcess = spawn(neuPath, ['--load-dir-res', '--path=.', '--export-auth-info', '--neu-dev-extension', '--window-hidden', '--port=0'], {
					cwd: root,
					stdio: ['ignore', 'ignore', 'ignore'],
				});

				// Wait up to 6 seconds for auth_info.json to be exported
				let attempts = 0;
				while (!existsSync(authInfoPath) && attempts < 30) {
					await new Promise((r) => setTimeout(r, 200));
					attempts++;
				}

				if (!existsSync(authInfoPath)) {
					cleanup();
					return reject(new Error('Timeout waiting for Neutralino server startup'));
				}

				const authInfo = JSON.parse(readFileSync(authInfoPath, 'utf-8')) as NeutralinoAuthInfo;
				const wsUrl = `ws://127.0.0.1:${authInfo.nlPort}/?connectToken=${authInfo.nlConnectToken}`;

				wsClient = new WebSocket(wsUrl);

				wsClient.onopen = () => {
					wsClient?.send(
						JSON.stringify({
							id: crypto.randomUUID(),
							method: 'extensions.dispatch',
							accessToken: authInfo.nlToken,
							data: {
								extensionId: options.extensionId,
								event: options.requestEvent,
								data: options.requestData,
							},
						}),
					);
				};

				wsClient.onmessage = (event) => {
					try {
						const response = JSON.parse(event.data) as NeutralinoWSResponse;
						if (response.event === options.responseEvent) {
							resolve(response.data as T);
							cleanup();
						}
					} catch (err) {
						reject(err);
						cleanup();
					}
				};

				wsClient.onerror = (err) => {
					reject(err);
					cleanup();
				};
			} catch (err) {
				cleanup();
				reject(err);
			}

			const timeout = setTimeout(() => {
				cleanup();
				reject(new Error('Neutralino extension test timed out after 8 seconds'));
			}, 8000);

			function cleanup() {
				clearTimeout(timeout);
				if (wsClient) wsClient.close();
				if (neuProcess) neuProcess.kill();
				if (existsSync(authInfoPath)) {
					rmSync(authInfoPath, { force: true });
				}
			}
		})();
	});
}
