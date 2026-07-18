import { beforeAll, describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
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

const HELPER_PATH = join(ROOT, 'bin', binaryName);
const DB_PATH = 'TheCelesteTrackerTestDb.db';

describe('SQLite via Go Utilities CLI — Integration Tests', () => {
	beforeAll(async () => {
		// Verify if binary exists, if not build it
		if (!existsSync(HELPER_PATH)) {
			console.log(`\n  Utilities CLI binary not found at: ${HELPER_PATH}`);
			console.log('🛠️ Building Go helper first...');
			await $`bun run build`.cwd(ROOT);
		}
		expect(existsSync(HELPER_PATH)).toBe(true);
	});

	test('Should successfully execute SQL query and return rows', () => {
		const sql = 'SELECT sqlite_version() AS version;';
		// Run helper, passing query via stdin
		const res = spawnSync(HELPER_PATH, ['sqlite', '--db', DB_PATH], {
			input: sql,
			encoding: 'utf8',
		});

		expect(res.status).toBe(0);
		const result = JSON.parse(res.stdout);
		expect(result.success).toBe(true);
		expect(result.rows).toBeArray();
		expect(result.rows.length).toBeGreaterThan(0);
		expect(result.rows[0].version).toBeString();
	});

	test('Should handle SQL errors gracefully', () => {
		const sql = 'SELECT * FROM non_existent_table_xyz;';
		const res = spawnSync(HELPER_PATH, ['sqlite', '--db', DB_PATH], {
			input: sql,
			encoding: 'utf8',
		});

		expect(res.status).not.toBe(0);
		const result = JSON.parse(res.stdout);
		expect(result.success).toBe(false);
		expect(result.error).toBeString();
		expect(result.error).toContain('no such table');
	});
});
