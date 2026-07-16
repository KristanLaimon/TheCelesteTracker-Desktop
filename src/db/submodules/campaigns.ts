import type { SQLiteExtension } from '../../libs/CSqliteExtension';
import type { Campaign } from '../db.types';

export default class _submodule_service_Campaigns {
	private readonly tablename: string = 'Campaigns';

	constructor(private con: SQLiteExtension) {}

	public async GetAll(): Promise<Campaign[]> {
		const res = await this.con.query<Campaign>(`SELECT * FROM ${this.tablename}`);
		if (res.success) {
			return res.rows;
		}
		throw new Error(res.error);
	}
}
