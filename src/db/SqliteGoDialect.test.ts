// NODE.JS/BUN/DENO ONLY
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Kysely } from "kysely";
import Sqlite_Go from "../../dependencies/exports/Sqlite_Go";
import { GetDependency, TEST_FOLDER, TEST_TEMP_FOLDER } from "../../testing/setup";
import { CTDB_Token, IFileSystem_Token, IOs_Token, IPath_Token } from "../core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../core/interfaces/IFileSystem";
import type { IOS } from "../core/interfaces/IOs";
import type { IPath } from "../core/interfaces/IPath";
import type { Database } from "./db.types";
import CTDB from "./index";
import { CreateTrackerDb } from "./SqliteGoDialect";

const db = GetDependency<Kysely<Database>>(CTDB_Token);

afterAll(() => {
	rmSync(TEST_TEMP_FOLDER, { recursive: true, force: true });
});

describe("SqliteGoDialect reads", () => {
	test("selects all rows of a table, typed", async () => {
		const campaigns = await db.selectFrom("Campaigns").selectAll().execute();
		expect(campaigns.length).toBeGreaterThan(0);
		expect(typeof campaigns[0].campaign_name_id).toBe("string");
		expect(typeof campaigns[0].id).toBe("number");
	});

	test("binds where-clause values as parameters", async () => {
		const first = await db.selectFrom("Campaigns").selectAll().orderBy("id").executeTakeFirstOrThrow();
		const found = await db.selectFrom("Campaigns").selectAll().where("id", "=", first.id).executeTakeFirst();
		expect(found?.campaign_name_id).toBe(first.campaign_name_id);
	});

	test("a SQL injection payload is bound as a plain value, not executed", async () => {
		const payload = "x'; DROP TABLE Campaigns; --";
		const rows = await db.selectFrom("Campaigns").selectAll().where("campaign_name_id", "=", payload).execute();
		expect(rows.length).toBe(0);

		const stillThere = await db.selectFrom("Campaigns").selectAll().execute();
		expect(stillThere.length).toBeGreaterThan(0);
	});

	test("joins across tables", async () => {
		const rows = await db
			.selectFrom("Chapters")
			.innerJoin("ChapterSides", "ChapterSides.chapter_sid", "Chapters.sid")
			.select(["Chapters.sid", "Chapters.campaign_id", "ChapterSides.side_id", "ChapterSides.berries_available"])
			.limit(5)
			.execute();
		expect(rows.length).toBeGreaterThan(0);
		expect(typeof rows[0].side_id).toBe("string");
	});

	test("quotes reserved-word columns", async () => {
		const rows = await db.selectFrom("ChapterSideRooms").select(["name", "order"]).orderBy("order").limit(3).execute();
		expect(rows.length).toBeGreaterThan(0);
		expect(typeof rows[0].order).toBe("number");
	});

	test("CTDB submodules resolve and read", async () => {
		const ctdb = GetDependency(CTDB);
		const campaigns = await ctdb.Campaigns.GetAll();
		expect(campaigns.length).toBeGreaterThan(0);

		const byId = await ctdb.Campaigns.GetById(campaigns[0].id);
		expect(byId?.id).toBe(campaigns[0].id);

		const count = await ctdb.Campaigns.Table()
			.select((eb) => eb.fn.countAll().as("total"))
			.executeTakeFirstOrThrow();
		expect(Number(count.total)).toBe(campaigns.length);

		const sessions = await ctdb.GameSessions.GetSessionsByLevelSet({ levelSetNames: ["StrawberryJam2021", "Celeste"], limit: 10 });
		expect(Array.isArray(sessions)).toBe(true);

		if (sessions.length > 0) {
			const roomStats = await ctdb.GameSessionChapterRoomStats.GetStatsByGameSessionIds({ gameSessionIds: [sessions[0].id] });
			expect(Array.isArray(roomStats)).toBe(true);
		}
	});
});

describe("SqliteGoDialect writes", () => {
	const writableDbPath = join(TEST_TEMP_FOLDER, "kysely_write_test.db");
	let writableDb: Kysely<Database>;

	beforeAll(() => {
		if (!existsSync(TEST_TEMP_FOLDER)) mkdirSync(TEST_TEMP_FOLDER, { recursive: true });
		rmSync(writableDbPath, { force: true });
		copyFileSync(join(TEST_FOLDER, "test_with_data.db"), writableDbPath);

		const con = new Sqlite_Go(writableDbPath, GetDependency<IOS>(IOs_Token), GetDependency<IFileSystem>(IFileSystem_Token), GetDependency<IPath>(IPath_Token));
		writableDb = CreateTrackerDb(con);
	});

	test("insert reports insertId and numAffectedRows, and the row reads back", async () => {
		const name = `kysely-test-user-${Date.now()}`;
		const res = await writableDb.insertInto("Users").values({ name }).executeTakeFirstOrThrow();
		expect(res.numInsertedOrUpdatedRows).toBe(1n);
		expect(Number(res.insertId)).toBeGreaterThan(0);

		const inserted = await writableDb.selectFrom("Users").selectAll().where("name", "=", name).executeTakeFirstOrThrow();
		expect(inserted.id).toBe(Number(res.insertId));
	});

	test("update and delete report affected rows", async () => {
		const name = `kysely-test-update-${Date.now()}`;
		await writableDb.insertInto("Users").values({ name }).execute();

		const updated = await writableDb
			.updateTable("Users")
			.set({ name: `${name}-renamed` })
			.where("name", "=", name)
			.executeTakeFirstOrThrow();
		expect(updated.numUpdatedRows).toBe(1n);

		const deleted = await writableDb.deleteFrom("Users").where("name", "=", `${name}-renamed`).executeTakeFirstOrThrow();
		expect(deleted.numDeletedRows).toBe(1n);
	});
});

test("transactions are rejected with an explicit message", async () => {
	const attempt = db.transaction().execute(async (trx) => trx.selectFrom("Campaigns").selectAll().execute());
	expect(attempt).rejects.toThrow(/transactions are not supported/);
});
