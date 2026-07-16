import { container } from 'tsyringe';
import { SQLiteExtension } from '../../src-utils-extension/SqliteExtension';
import { UtilitiesExtension } from '../../src-utils-extension/UtilitiesExtension';
import { NeutralinoFileSystem } from './NeutralinoFileSystem';

container.registerSingleton(NeutralinoFileSystem);
container.registerSingleton(UtilitiesExtension);
container.registerInstance(SQLiteExtension, new SQLiteExtension('./TheCelesteTrackerTestDb.db', container.resolve(NeutralinoFileSystem)));

const get = container.resolve.bind(container);

export { get };
