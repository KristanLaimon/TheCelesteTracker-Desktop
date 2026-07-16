import { container } from 'tsyringe';
import { SQLiteExtension } from './CSqliteExtension';

container.registerInstance(SQLiteExtension, new SQLiteExtension('TheCelesteTrackerTestDb.db'));

const get = container.resolve.bind(container);

export { get };
