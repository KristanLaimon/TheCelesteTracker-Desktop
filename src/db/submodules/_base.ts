// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/complexity/noBannedTypes: Kysely spells "nothing selected yet" as {}

import type { Kysely, Selectable, SelectQueryBuilder } from "kysely";
import { Log_Error } from "../../utils/Logger";
import type { Database } from "../db.types";

/**
 * Shared read surface for one table. Subclasses add the primary-key lookup their table actually has.
 * Reads never throw: on failure they log and return the empty value, matching the rest of the app.
 */
export default abstract class TableSubmodule<K extends keyof Database & string> {
	protected constructor(
		protected readonly db: Kysely<Database>,
		protected readonly tablename: K,
	) {}

	/** Typed query builder for this table: joins, aggregates, filters, anything `GetAll` does not cover. */
	public Table(): SelectQueryBuilder<Database, K, {}> {
		// Kysely resolves the alias as ExtractTableAlias<Database, K>, which it does not export and cannot narrow for a generic K.
		return this.db.selectFrom(this.tablename) as unknown as SelectQueryBuilder<Database, K, {}>;
	}

	public async GetAll(): Promise<Selectable<Database[K]>[]> {
		try {
			return (await this.db.selectFrom(this.tablename).selectAll().execute()) as Selectable<Database[K]>[];
		} catch (error) {
			Log_Error(`${this.tablename}.GetAll failed: ${error}`);
			return [];
		}
	}
}
