import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { runDirectExtensionTest } from '../src/extensions/directTestHelper';

const TMP_DIR = join(import.meta.dir, './temp');
const ZIP_PATH = join(TMP_DIR, 'test.zip');

interface ZipReadTextFileResponse {
	reqId: string;
	result: {
		success: boolean;
		content?: string;
		error?: string;
	};
}

describe('Utilities Go Extension Direct Integration Tests (No Neutralino)', () => {
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

	const binaryName = process.platform === 'win32' ? 'utilities-win_x64.exe' : 'utilities-linux_x64';

	test('Should read file inside zip in-memory directly', async () => {
		const payload = await runDirectExtensionTest<ZipReadTextFileResponse>({
			binaryName,
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
	});
});
