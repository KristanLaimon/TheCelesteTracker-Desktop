import AdmZip from 'adm-zip';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { runNeutralinoExtensionTest } from '../src/extensions/neutralinoTestHelper';

const TMP_DIR = join(import.meta.dir, '../../.tmp/tests');
const ZIP_PATH = join(TMP_DIR, 'test.zip');

interface ZipReadTextFileResponse {
	reqId: string;
	result: {
		success: boolean;
		content?: string;
		error?: string;
	};
}

describe('Utilities Go Extension Neutralino Integration Tests (With Neutralino)', () => {
	beforeAll(() => {
		// Create temporary zip archive for testing
		if (!existsSync(TMP_DIR)) {
			mkdirSync(TMP_DIR, { recursive: true });
		}
		const zip = new AdmZip();
		zip.addFile('hello.txt', Buffer.from('Hello, Celeste Modder!', 'utf8'));
		zip.writeZip(ZIP_PATH);
	});

	afterAll(() => {
		// Clean up testing file
		if (existsSync(ZIP_PATH)) {
			rmSync(ZIP_PATH, { force: true });
		}
	});

	test(
		'Should route zip read request through Neutralino websocket server',
		async () => {
			const payload = await runNeutralinoExtensionTest<ZipReadTextFileResponse>({
				extensionId: 'utilities',
				requestEvent: 'zip.readTextFile',
				requestData: {
					zipPath: ZIP_PATH,
					filePath: 'hello.txt',
				},
				responseEvent: 'zip.readTextFileResult',
			});

			expect(payload.result.success).toBe(true);
			expect(payload.result.content).toBe('Hello, Celeste Modder!');
		},
		{ timeout: 10_000 },
	);
});
