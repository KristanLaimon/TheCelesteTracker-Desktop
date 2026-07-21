// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: tsrynge and dependency injection needed

import { injectable } from 'tsyringe';
import _submodule_service_Campaigns from './submodules/campaigns';

@injectable()
export default class CTDB {
	constructor(public Campaigns: _submodule_service_Campaigns) {}

  public GetAllModsPlayed
}
