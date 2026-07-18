import { container } from 'tsyringe';
import { Sqlite_Go } from '../../src-utils/Sqlite';
import { Zip_Go } from '../../src-utils/Zip';
import { NeutralinoFileSystem } from './NeutralinoFileSystem';

container.registerSingleton(NeutralinoFileSystem);
container.registerSingleton(Zip_Go);
container.registerInstance(Sqlite_Go, new Sqlite_Go('./TheCelesteTrackerTestDb.db', container.resolve(NeutralinoFileSystem)));

const get = container.resolve.bind(container);

export { get };
