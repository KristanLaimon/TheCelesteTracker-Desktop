// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import { CTDB_Token } from "@core/interfaces/DependencyInjectionTokens";
import { Log_Error } from "@utils/Logger";
import type { Kysely } from "kysely";
import { inject, injectable } from "tsyringe";
import type { CollectionCampaign, Database } from "../db.types";
import TableSubmodule from "./_base";

@injectable()
export default class _submodule_service_CollectionCampaigns extends TableSubmodule<"CollectionCampaigns"> {
	constructor(@inject(CTDB_Token) db: Kysely<Database>) {
		super(db, "CollectionCampaigns");
	}

	public async GetByCollection(collectionId: number): Promise<CollectionCampaign[]> {
		try {
			return await this.db.selectFrom("CollectionCampaigns").selectAll().where("collection_id", "=", collectionId).execute();
		} catch (error) {
			Log_Error(`CollectionCampaigns.GetByCollection failed: ${error}`);
			return [];
		}
	}
}
