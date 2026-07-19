import { container } from 'tsyringe';
import Sqlite_Go from '../../src-utils/Sqlite_Go';
import Zip_Go from '../../src-utils/Zip_Go';
import { IFileSystem } from '../interfaces/IFileSystem';
import Celeste from './Celeste';
import Everest from './Everest';
import { NeutralinoFileSystem } from './NeutralinoFileSystem';
import { NeutralinoOS } from './NeutralinoOS';
import Olympus from './Olympus';

container.registerSingleton(Celeste);
container.registerSingleton(Everest);
container.registerSingleton(Olympus);
container.registerSingleton(NeutralinoFileSystem);
container.registerSingleton(NeutralinoOS);
container.registerSingleton(Zip_Go);
container.registerInstance(Sqlite_Go, new Sqlite_Go('./TheCelesteTrackerTestDb.db', container.resolve(NeutralinoOS), container.resolve(NeutralinoFileSystem)));
//@ts-expect-error IFileSystem will never be constructed (abstract-class-interface like), so there should be no problems.
container.registerInstance(IFileSystem, new NeutralinoFileSystem());

const GetDependency = container.resolve.bind(container);

export { GetDependency as get, GetDependency };

