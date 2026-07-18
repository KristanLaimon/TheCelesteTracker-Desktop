import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import AdmZip from 'adm-zip';

const TMP_DIR = join(import.meta.dir, './temp');
const ZIP_PATH = join(TMP_DIR, 'test.zip');

const ROOT = join(import.meta.dir, '..');
const platform = process.platform;

// Determine Go binary name based on platform
let binaryName = 'utilities-win_x64.exe';
if (platform === 'linux') {
	binaryName = 'utilities-linux_x64';
} else if (platform === 'darwin') {
	binaryName = 'utilities-mac_x64';
}

const HELPER_PATH = join(ROOT, 'bin', binaryName);

describe('Utilities Go CLI Direct Integration Tests (No Neutralino)', () => {
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

	test('Should read file inside zip in-memory directly', () => {
		const res = spawnSync(HELPER_PATH, ['zip', 'read', '--zip', ZIP_PATH, '--file', 'hello.txt'], {
			encoding: 'utf8',
		});

		expect(res.status).toBe(0);
		const payload = JSON.parse(res.stdout);
		expect(payload.success).toBe(true);
		expect(payload.content).toBe('Hello, Celeste Modder!');
	});
});
