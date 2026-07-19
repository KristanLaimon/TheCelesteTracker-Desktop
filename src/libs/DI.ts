import { container } from 'tsyringe';
import { Sqlite_Go } from '../../src-utils/Sqlite';
import { Zip_Go } from '../../src-utils/Zip';
import { NeutralinoFileSystem } from './NeutralinoFileSystem';
import { NeutralinoOS } from './NeutralinoOS';

container.registerSingleton(NeutralinoFileSystem);
container.registerSingleton(NeutralinoOS);
container.registerSingleton(Zip_Go);
container.registerInstance(Sqlite_Go, new Sqlite_Go('./TheCelesteTrackerTestDb.db', container.resolve(NeutralinoFileSystem)));

const GetDependency = container.resolve.bind(container);

export { GetDependency as get, GetDependency };
