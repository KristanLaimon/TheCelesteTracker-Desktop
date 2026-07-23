// NODE.JS/BUN/DENO ONLY
import { expect, test } from "bun:test";
import Sqlite_Go from "../src-utils/Sqlite_Go";

import { GetDependency } from "./setup";

test("Sqlite_Go resolves from DI and queries Campaigns", async () => {
	const db = GetDependency(Sqlite_Go);
	const res = await db.Query("SELECT * FROM Campaigns;");
	expect(res.success).toBeTrue();
	if (res.success) {
		expect(res.rows.length).toBeGreaterThan(0);
	}
});
