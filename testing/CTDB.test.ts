import { beforeAll, describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Campaign, ChapterSide, SaveData, User } from '../src/db/db.types';
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

interface QueryResult {
	rows: Record<string, unknown>[];
	error?: string;
}

function queryDb(sql: string): QueryResult {
	const res = spawnSync(HELPER_PATH, ['sqlite', '--db', DB_PATH], { input: sql, encoding: 'utf8' });
	const parsed = JSON.parse(res.stdout);
	if (!parsed.success) {
		return { rows: [], error: parsed.error };
	}
	return { rows: parsed.rows ?? [] };
}

describe('CTDB type shape validation (via CLI binary)', () => {
	beforeAll(() => {
		ensureBuild();
		if (!existsSync(DB_PATH) || !existsSync(HELPER_PATH)) {
			throw new Error('Test db or binary missing');
		}
	});

	test('Campaigns table matches Campaign type', () => {
		const { rows, error } = queryDb('SELECT * FROM Campaigns LIMIT 3;');
		expect(error).toBeUndefined();
		expect(rows.length).toBe(3);

		for (const row of rows) {
			const r = row as unknown as Campaign;
			expect(typeof r.id).toBe('number');
			expect(typeof r.save_data_id).toBe('number');
			expect(typeof r.campaign_name_id).toBe('string');
		}
	});

	test('Campaigns count is 88', () => {
		const { rows, error } = queryDb('SELECT COUNT(*) AS count FROM Campaigns;');
		expect(error).toBeUndefined();
		expect(Number(rows[0].count)).toBe(88);
	});

	test('Users table matches User type', () => {
		const { rows } = queryDb('SELECT id, name FROM Users ORDER BY id;');
		expect(rows.length).toBeGreaterThanOrEqual(2);

		for (const row of rows) {
			const r = row as unknown as User;
			expect(typeof r.id).toBe('number');
			expect(typeof r.name).toBe('string');
		}
	});

	test('ChapterSides matches ChapterSide type', () => {
		const { rows } = queryDb('SELECT chapter_sid, side_id, berries_available, berries_collected, heart_collected FROM ChapterSides LIMIT 5;');
		expect(rows.length).toBe(5);

		for (const row of rows) {
			const r = row as unknown as ChapterSide;
			expect(typeof r.chapter_sid).toBe('string');
			expect(typeof r.side_id).toBe('string');
			expect(typeof r.berries_available).toBe('number');
			expect(typeof r.berries_collected).toBe('number');
		}
	});

	test('SaveDatas matches SaveData type', () => {
		const { rows } = queryDb('SELECT id, user_id, slot_number, file_name FROM SaveDatas LIMIT 5;');
		expect(rows.length).toBe(5);

		for (const row of rows) {
			const r = row as unknown as SaveData;
			expect(typeof r.id).toBe('number');
			expect(typeof r.user_id).toBe('number');
			expect(typeof r.slot_number).toBe('number');
			expect(typeof r.file_name).toBe('string');
		}
	});

	test('src/db/index.ts CTDB import is valid', async () => {
		const { default: CTDB } = await import('../src/db/index');
		expect(CTDB).toBeDefined();
	});

	test('src/db/db.types Campaign type compiles correctly', () => {
		const { rows } = queryDb('SELECT id, save_data_id, campaign_name_id FROM Campaigns LIMIT 1;');
		const r = rows[0] as unknown as Campaign;
		expect(typeof r.id).toBe('number');
		expect(typeof r.save_data_id).toBe('number');
		expect(typeof r.campaign_name_id).toBe('string');
	});
});
