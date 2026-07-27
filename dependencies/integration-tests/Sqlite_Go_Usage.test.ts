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
