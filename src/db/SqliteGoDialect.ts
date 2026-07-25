// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: SqliteAdapter and friends are values, Sqlite_Go is used as a DI token

import type { CompiledQuery, DatabaseConnection, DatabaseIntrospector, Dialect, Driver, QueryCompiler, QueryResult } from "kysely";
import { Kysely, SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import Sqlite_Go from "../../src-utils/Sqlite_Go";
import type { Database } from "./db.types";

const TRANSACTIONS_UNSUPPORTED =
	"SqliteGoDialect: transactions are not supported. Every statement runs in its own Go CLI process, so a transaction cannot span calls. Batch the work into a single statement instead.";

/** One stateless connection: each query spawns its own process, so there is nothing to pool or keep alive. */
class SqliteGoConnection implements DatabaseConnection {
	constructor(private readonly con: Sqlite_Go) {}

	public async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
		const res = await this.con.Execute<R>(compiledQuery.sql, compiledQuery.parameters);
		return {
			rows: res.rows,
			numAffectedRows: BigInt(res.changes),
			insertId: BigInt(res.lastInsertRowId),
		};
	}

	// biome-ignore lint/correctness/useYield: required by the DatabaseConnection interface, unsupported here
	public async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
		throw new Error("SqliteGoDialect: streaming is not supported, the Go CLI returns the whole result set at once.");
	}
}

class SqliteGoDriver implements Driver {
	readonly #connection: SqliteGoConnection;

	constructor(con: Sqlite_Go) {
		this.#connection = new SqliteGoConnection(con);
	}

	public async init(): Promise<void> {}
	public async acquireConnection(): Promise<DatabaseConnection> {
		return this.#connection;
	}
	public async releaseConnection(): Promise<void> {}
	public async destroy(): Promise<void> {}

	public async beginTransaction(): Promise<void> {
		throw new Error(TRANSACTIONS_UNSUPPORTED);
	}
	public async commitTransaction(): Promise<void> {
		throw new Error(TRANSACTIONS_UNSUPPORTED);
	}
	public async rollbackTransaction(): Promise<void> {
		throw new Error(TRANSACTIONS_UNSUPPORTED);
	}
}

/**
 * Kysely dialect running SQL through the Go CLI helper (`Sqlite_Go`) instead of a native driver.
 * Parameters are bound by SQLite, never interpolated.
 */
export default class SqliteGoDialect implements Dialect {
	constructor(private readonly con: Sqlite_Go) {}

	public createAdapter(): SqliteAdapter {
		return new SqliteAdapter();
	}
	public createDriver(): Driver {
		return new SqliteGoDriver(this.con);
	}
	public createQueryCompiler(): QueryCompiler {
		return new SqliteQueryCompiler();
	}
	// biome-ignore lint/suspicious/noExplicitAny: Kysely's own introspector signature is schema-agnostic
	public createIntrospector(db: Kysely<any>): DatabaseIntrospector {
		return new SqliteIntrospector(db);
	}
}

/** Builds the typed query builder both composition roots register under `Kysely_Token`. */
export function CreateTrackerDb(con: Sqlite_Go): Kysely<Database> {
	return new Kysely<Database>({ dialect: new SqliteGoDialect(con) });
}
