// NODE.JS/BUN/DENO ONLY
import { expect, test } from "bun:test";
import { GetDependency } from "../../testing/setup";
import Sqlite_Go from "../exports/Sqlite_Go";

test("Sqlite_Go resolves from DI and queries Campaigns", async () => {
	const db = GetDependency(Sqlite_Go);
	const res = await db.Query("SELECT * FROM Campaigns;");
	expect(res.success).toBeTrue();
	if (res.success) {
		expect(res.rows.length).toBeGreaterThan(0);
	}
});

test("Sqlite_Go throws informative error message on invalid SQL", async () => {
	const db = GetDependency(Sqlite_Go);
	expect(db.Execute("SELECT * FROM non_existent_table_xyz;")).rejects.toThrow("no such table: non_existent_table_xyz");
});

test("Sqlite_Go throws informative error message on unsupported parameter type", async () => {
	const db = GetDependency(Sqlite_Go);
	expect(db.Execute("SELECT * FROM Campaigns WHERE id = ?;", [{ invalidObj: 123 }])).rejects.toThrow("unsupported SQL parameter type");
});
