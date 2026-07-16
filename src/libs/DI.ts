import { container } from 'tsyringe';
import { SQLiteExtension } from './CSqliteExtension';
import { NeutralinoFileSystem } from './NeutralinoFileSystem';

container.registerInstance(SQLiteExtension, new SQLiteExtension('./TheCelesteTrackerTestDb.db', container.resolve(NeutralinoFileSystem)));

const get = container.resolve.bind(container);

export { get };
