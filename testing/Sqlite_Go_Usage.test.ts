import { afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ensureBuild } from './build-utils';

const ROOT = join(import.meta.dir, '..');
const { platform } = process;

let binaryName = 'utilities-win_x64.exe';
if (platform === 'linux') {
	binaryName = 'utilities-linux_x64';
} else if (platform === 'darwin') {
	binaryName = 'utilities-mac_x64';
}

const HELPER_PATH = join(ROOT, 'bin', binaryName);
const DB_PATH = join(ROOT, 'TheCelesteTrackerTestDb.db');

function runSqlite(args: string[], input?: string): ReturnType<typeof spawnSync> {
	return spawnSync(HELPER_PATH, ['sqlite', ...args], { input, encoding: 'utf8' });
}

function cleanTestUsers(namePrefix: string): void {
	runSqlite(['--db', DB_PATH], `DELETE FROM Users WHERE name LIKE '${namePrefix}%';`);
}

describe('SQLite via Go Utilities CLI', () => {
	beforeAll(() => {
		ensureBuild();
		if (!existsSync(DB_PATH)) {
			throw new Error(`Test database not found at ${DB_PATH}`);
		}
	});

	describe('Flag combinations: --db + query source', () => {
		test('--db flag with stdin SELECT query returns rows', () => {
			const res = runSqlite(['--db', DB_PATH], 'SELECT sqlite_version() AS version;');
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
			expect(Array.isArray(result.rows)).toBe(true);
			expect(result.rows.length).toBeGreaterThan(0);
			expect(typeof result.rows[0].version).toBe('string');
		});

		test('--db flag with --query flag SELECT returns rows', () => {
			const res = runSqlite(['--db', DB_PATH, '--query', 'SELECT sqlite_version() AS version;']);
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
			expect(result.rows.length).toBeGreaterThan(0);
		});

		test('Short flags -d and -q work', () => {
			const res = runSqlite(['-d', DB_PATH, '-q', 'SELECT 1 AS val;']);
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
			expect(result.rows[0].val).toBe(1);
		});
	});

	describe('Error handling', () => {
		test('No flags errors about missing --db', () => {
			const res = runSqlite([]);
			expect(res.status).not.toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(false);
			expect(result.error).toContain('--db');
		});

		test('--db with empty stdin query errors', () => {
			const res = runSqlite(['--db', DB_PATH], '');
			expect(res.status).not.toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(false);
			expect(result.error.toLowerCase()).toContain('empty');
		});

		test('--db with --query but empty string errors', () => {
			const res = runSqlite(['--db', DB_PATH, '--query', '']);
			expect(res.status).not.toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(false);
		});

		test('Bad SQL returns error gracefully', () => {
			const res = runSqlite(['--db', DB_PATH, '--query', 'SELECT * FROM non_existent_table_xyz;']);
			expect(res.status).not.toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(false);
			expect(typeof result.error).toBe('string');
		});

		test('Non-existent db path errors', () => {
			const res = runSqlite(['--db', join(ROOT, 'nonexistent_dir', 'no.db'), '--query', 'SELECT 1;']);
			expect(res.status).not.toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(false);
			expect(typeof result.error).toBe('string');
		});
	});

	describe('DML operations via stdin', () => {
		const TEST_PREFIX = 'cli_test_';

		afterEach(() => {
			cleanTestUsers(TEST_PREFIX);
		});

		test('INSERT via stdin returns success', () => {
			const name = `${TEST_PREFIX}insert_${Date.now()}`;
			const res = runSqlite(['--db', DB_PATH], `INSERT INTO Users (name) VALUES ('${name}');`);
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
			expect(result.rows).toBeUndefined();
		});

		test('INSERT via --query flag works', () => {
			const name = `${TEST_PREFIX}flag_${Date.now()}`;
			const res = runSqlite(['--db', DB_PATH, '--query', `INSERT INTO Users (name) VALUES ('${name}');`]);
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
		});

		test('INSERT and verify via SELECT', () => {
			const name = `${TEST_PREFIX}verify_${Date.now()}`;
			runSqlite(['--db', DB_PATH], `INSERT INTO Users (name) VALUES ('${name}');`);
			const check = runSqlite(['--db', DB_PATH], `SELECT id FROM Users WHERE name = '${name}';`);
			expect(check.status).toBe(0);
			const result = JSON.parse(check.stdout.toString());
			expect(result.success).toBe(true);
			expect(result.rows.length).toBe(1);
			expect(typeof result.rows[0].id).toBe('number');
		});

		test('UPDATE via stdin succeeds', () => {
			const name = `${TEST_PREFIX}update_${Date.now()}`;
			runSqlite(['--db', DB_PATH], `INSERT INTO Users (name) VALUES ('${name}');`);
			const res = runSqlite(['--db', DB_PATH], `UPDATE Users SET name = '${name}_updated' WHERE name = '${name}';`);
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
		});

		test('UPDATE with no matching rows still succeeds', () => {
			const res = runSqlite(['--db', DB_PATH, '--query', `UPDATE Users SET name = 'nobody' WHERE name = '${TEST_PREFIX}nonexistent_${Date.now()}';`]);
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
		});

		test('DELETE via stdin succeeds', () => {
			const name = `${TEST_PREFIX}delete_${Date.now()}`;
			runSqlite(['--db', DB_PATH], `INSERT INTO Users (name) VALUES ('${name}');`);
			const res = runSqlite(['--db', DB_PATH], `DELETE FROM Users WHERE name = '${name}';`);
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
		});
	});

	describe('Real data queries against test database', () => {
		test('Query Users table returns existing users', () => {
			const res = runSqlite(['--db', DB_PATH], 'SELECT id, name FROM Users ORDER BY id;');
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
			expect(result.rows.length).toBeGreaterThanOrEqual(2);
			expect(result.rows[0]).toHaveProperty('id');
			expect(result.rows[0]).toHaveProperty('name');
		});

		test('Query Campaigns table returns data', () => {
			const res = runSqlite(['--db', DB_PATH], 'SELECT COUNT(*) AS cnt FROM Campaigns;');
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
			expect(Number(result.rows[0].cnt)).toBeGreaterThan(0);
		});

		test('Query Chapters with JOIN returns relational data', () => {
			const res = runSqlite(
				['--db', DB_PATH],
				`
				SELECT c.sid, c.name, cp.campaign_name_id
				FROM Chapters c
				JOIN Campaigns cp ON c.campaign_id = cp.id
				LIMIT 5;
			`,
			);
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
			expect(result.rows.length).toBe(5);
			expect(result.rows[0]).toHaveProperty('sid');
			expect(result.rows[0]).toHaveProperty('campaign_name_id');
		});

		test('Aggregate query with GROUP BY works', () => {
			const res = runSqlite(
				['--db', DB_PATH],
				`
				SELECT cs.side_id, COUNT(*) AS chapter_count
				FROM ChapterSides cs
				GROUP BY cs.side_id
				ORDER BY chapter_count DESC;
			`,
			);
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
			expect(result.rows.length).toBeGreaterThan(0);
			expect(result.rows[0]).toHaveProperty('side_id');
			expect(result.rows[0]).toHaveProperty('chapter_count');
		});
	});

	describe('DDL operations', () => {
		test('CREATE TEMP TABLE works', () => {
			const res = runSqlite(['--db', DB_PATH], 'CREATE TEMP TABLE IF NOT EXISTS test_ddl (id INTEGER PRIMARY KEY, val TEXT);');
			expect(res.status).toBe(0);
			const result = JSON.parse(res.stdout.toString());
			expect(result.success).toBe(true);
		});
	});
});
