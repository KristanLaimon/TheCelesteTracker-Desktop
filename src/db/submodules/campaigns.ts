// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import Sqlite_Go from "@go/Sqlite_Go";
import { Log_Error } from "@utils/Logger";
import { injectable } from "tsyringe";
import type { Campaign } from "../db.types";

@injectable()
export default class _submodule_service_Campaigns {
	private readonly tablename: string = "Campaigns";

	constructor(private con: Sqlite_Go) {}

	public async GetAll(): Promise<Campaign[]> {
		const res = await this.con.Query<Campaign>(`SELECT * FROM ${this.tablename}`);
		if (res.success) {
			return res.rows;
		}
		Log_Error(res.error);
		return [];
	}
}
