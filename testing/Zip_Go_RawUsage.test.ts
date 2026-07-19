import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EnsureBuildAndGetPathExe } from './setup';

const TMP_DIR = join(import.meta.dir, './temp');
const FIXTURE_SRC = join(TMP_DIR, 'fixture_src');
const ZIP_PATH = join(TMP_DIR, 'test.zip');
const EXTRACT_DIR = join(TMP_DIR, 'extracted');
const PACK_SRC = join(TMP_DIR, 'pack_src');
const PACK_ZIP = join(TMP_DIR, 'pack_result.zip');

const ROOT = join(import.meta.dir, '..');
const { platform } = process;

let binaryName = 'utilities-win_x64.exe';
if (platform === 'linux') {
	binaryName = 'utilities-linux_x64';
} else if (platform === 'darwin') {
	binaryName = 'utilities-mac_x64';
}

const HELPER_PATH = join(ROOT, 'bin', binaryName);

function runZip(args: string[]): ReturnType<typeof spawnSync> {
	return spawnSync(HELPER_PATH, ['zip', ...args], { encoding: 'utf8' });
}

function parseZipResult(res: ReturnType<typeof spawnSync>): Record<string, unknown> {
	if (res.stdout) {
		try {
			return JSON.parse(res.stdout.toString());
		} catch {
			// not JSON output
		}
	}
	return { success: false, error: res.stderr || 'unknown error' };
}

function createTestZip(): void {
	rmSync(TMP_DIR, { recursive: true, force: true });
	mkdirSync(join(FIXTURE_SRC, 'subdir'), { recursive: true });
	writeFileSync(join(FIXTURE_SRC, 'hello.txt'), 'Hello, Celeste Modder!');
	writeFileSync(join(FIXTURE_SRC, 'subdir', 'nested.txt'), 'Nested content');
	writeFileSync(join(FIXTURE_SRC, 'data.json'), JSON.stringify({ key: 'value', num: 42 }));

	const res = runZip(['pack', '--src', FIXTURE_SRC, '--zip', ZIP_PATH]);
	if (res.status !== 0) {
		throw new Error(`Failed to create test zip: ${res.stderr}`);
	}
}

function createPackSource(): void {
	if (!existsSync(PACK_SRC)) {
		mkdirSync(PACK_SRC, { recursive: true });
	}
	writeFileSync(join(PACK_SRC, 'file1.txt'), 'File 1 content');
	mkdirSync(join(PACK_SRC, 'sub'), { recursive: true });
	writeFileSync(join(PACK_SRC, 'sub', 'file2.txt'), 'File 2 content');
}

describe('Zip via Go Utilities CLI', () => {
	beforeAll(() => {
		EnsureBuildAndGetPathExe();
		createTestZip();
		createPackSource();
	});

	afterAll(() => {
		if (existsSync(TMP_DIR)) {
			rmSync(TMP_DIR, { recursive: true, force: true });
		}
	});

	describe('zip read', () => {
		test('Reads file content from zip', () => {
			const res = runZip(['read', '--zip', ZIP_PATH, '--file', 'hello.txt']);
			expect(res.status).toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(true);
			expect(payload.content).toBe('Hello, Celeste Modder!');
		});

		test('Reads nested file from subdirectory', () => {
			const res = runZip(['read', '--zip', ZIP_PATH, '--file', 'subdir/nested.txt']);
			expect(res.status).toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(true);
			expect(payload.content).toBe('Nested content');
		});

		test('Reads JSON file', () => {
			const res = runZip(['read', '--zip', ZIP_PATH, '--file', 'data.json']);
			expect(res.status).toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(true);
			const parsed = JSON.parse(payload.content);
			expect(parsed.key).toBe('value');
			expect(parsed.num).toBe(42);
		});

		test('Case-insensitive file matching', () => {
			const res = runZip(['read', '--zip', ZIP_PATH, '--file', 'HELLO.TXT']);
			expect(res.status).toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(true);
			expect(payload.content).toBe('Hello, Celeste Modder!');
		});

		test('Read via short flags -z and -f', () => {
			const res = runZip(['read', '-z', ZIP_PATH, '-f', 'hello.txt']);
			expect(res.status).toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(true);
			expect(payload.content).toBe('Hello, Celeste Modder!');
		});
	});

	describe('zip list', () => {
		test('Lists all files in archive', () => {
			const res = runZip(['list', '--zip', ZIP_PATH]);
			expect(res.status).toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(true);
			expect(payload.files).toContain('hello.txt');
			expect(payload.files).toContain('subdir/nested.txt');
			expect(payload.files).toContain('data.json');
			expect(payload.files).toContain('subdir/');
			expect(payload.files.length).toBe(4);
		});

		test('List via short flag -z', () => {
			const res = runZip(['list', '-z', ZIP_PATH]);
			expect(res.status).toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(true);
			expect(payload.files.length).toBe(4);
		});
	});

	describe('zip unzip', () => {
		test('Extracts all files to destination directory', () => {
			const extractDir = join(TMP_DIR, `extract_${Date.now()}`);
			const res = runZip(['unzip', '--zip', ZIP_PATH, '--dest', extractDir]);
			expect(res.status).toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(true);
			expect(readFileSync(join(extractDir, 'hello.txt'), 'utf8')).toBe('Hello, Celeste Modder!');
			expect(readFileSync(join(extractDir, 'subdir', 'nested.txt'), 'utf8')).toBe('Nested content');
			rmSync(extractDir, { recursive: true, force: true });
		});

		test('Unzip via short flags -z and -e', () => {
			const extractDir = join(TMP_DIR, `extract_short_${Date.now()}`);
			const res = runZip(['unzip', '-z', ZIP_PATH, '-e', extractDir]);
			expect(res.status).toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(true);
			expect(existsSync(join(extractDir, 'hello.txt'))).toBe(true);
			rmSync(extractDir, { recursive: true, force: true });
		});
	});

	describe('zip pack', () => {
		test('Creates zip from directory and verifies via read', () => {
			const outputZip = join(TMP_DIR, `pack_${Date.now()}.zip`);
			const packRes = runZip(['pack', '--src', PACK_SRC, '--zip', outputZip]);
			expect(packRes.status).toBe(0);
			expect(JSON.parse(packRes.stdout.toString()).success).toBe(true);
			expect(existsSync(outputZip)).toBe(true);

			const readRes = runZip(['read', '--zip', outputZip, '--file', 'file1.txt']);
			expect(readRes.status).toBe(0);
			expect(JSON.parse(readRes.stdout.toString()).content).toBe('File 1 content');

			const listRes = runZip(['list', '--zip', outputZip]);
			expect(JSON.parse(listRes.stdout.toString()).files).toContain('sub/file2.txt');

			rmSync(outputZip);
		});

		test('Pack via short flags -s and -z', () => {
			const outputZip = join(TMP_DIR, `pack_short_${Date.now()}.zip`);
			const res = runZip(['pack', '-s', PACK_SRC, '-z', outputZip]);
			expect(res.status).toBe(0);
			expect(JSON.parse(res.stdout.toString()).success).toBe(true);
			expect(existsSync(outputZip)).toBe(true);

			const listRes = runZip(['list', '-z', outputZip]);
			expect(JSON.parse(listRes.stdout.toString()).files.length).toBe(3);

			rmSync(outputZip);
		});
	});

	describe('Error handling', () => {
		test('zip read without --zip errors', () => {
			const res = runZip(['read', '--file', 'hello.txt']);
			expect(res.status).not.toBe(0);
			const payload = parseZipResult(res);
			expect(payload.success).toBe(false);
		});

		test('zip read without --file errors', () => {
			const res = runZip(['read', '--zip', ZIP_PATH]);
			expect(res.status).not.toBe(0);
			const payload = parseZipResult(res);
			expect(payload.success).toBe(false);
		});

		test('zip read with no arguments errors', () => {
			const res = runZip(['read']);
			expect(res.status).not.toBe(0);
			const payload = parseZipResult(res);
			expect(payload.success).toBe(false);
		});

		test('zip list without --zip errors', () => {
			const res = runZip(['list']);
			expect(res.status).not.toBe(0);
			const payload = parseZipResult(res);
			expect(payload.success).toBe(false);
		});

		test('zip unzip without --dest errors', () => {
			const res = runZip(['unzip', '--zip', ZIP_PATH]);
			expect(res.status).not.toBe(0);
			const payload = parseZipResult(res);
			expect(payload.success).toBe(false);
		});

		test('zip unzip without --zip errors', () => {
			const res = runZip(['unzip', '--dest', EXTRACT_DIR]);
			expect(res.status).not.toBe(0);
			const payload = parseZipResult(res);
			expect(payload.success).toBe(false);
		});

		test('zip pack without --src errors', () => {
			const res = runZip(['pack', '--zip', PACK_ZIP]);
			expect(res.status).not.toBe(0);
			const payload = parseZipResult(res);
			expect(payload.success).toBe(false);
		});

		test('zip pack without --zip errors', () => {
			const res = runZip(['pack', '--src', PACK_SRC]);
			expect(res.status).not.toBe(0);
			const payload = parseZipResult(res);
			expect(payload.success).toBe(false);
		});

		test('zip read with non-existent file errors', () => {
			const res = runZip(['read', '--zip', ZIP_PATH, '--file', 'nonexistent.txt']);
			expect(res.status).not.toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(false);
			expect(payload.error).toContain('not found');
		});

		test('zip list with non-existent zip errors', () => {
			const res = runZip(['list', '--zip', join(TMP_DIR, 'no_such.zip')]);
			expect(res.status).not.toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(false);
		});

		test('zip unzip with non-existent zip errors', () => {
			const res = runZip(['unzip', '--zip', join(TMP_DIR, 'no_such.zip'), '--dest', EXTRACT_DIR]);
			expect(res.status).not.toBe(0);
			const payload = JSON.parse(res.stdout.toString());
			expect(payload.success).toBe(false);
		});
	});
});
