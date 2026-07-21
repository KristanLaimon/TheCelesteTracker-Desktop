// UNIVERSAL COMPATIBILITY
import { container } from 'tsyringe';
import Sqlite_Go from '../../src-utils/Sqlite_Go';
import Zip_Go from '../../src-utils/Zip_Go';
import { IFileSystem_Token, IOs_Token, IPath_Token, IThreadConstructor_Token } from '../interfaces/DependencyInjectionTokens';
import Path from './BrowserPath';
import Celeste from './Celeste';
import Everest from './Everest';
import { NeutralinoFileSystem } from './NeutralinoFileSystem';
import { NeutralinoOS } from './NeutralinoOS';
import Olympus from './Olympus';
import { ThreadBrowser } from './ThreadBrowser';

container.registerSingleton(IFileSystem_Token, NeutralinoFileSystem);
container.registerSingleton(IOs_Token, NeutralinoOS);
container.register(IPath_Token, { useValue: Path });
container.register(IThreadConstructor_Token, { useValue: ThreadBrowser });
container.registerSingleton(Celeste);
container.registerSingleton(Everest);
container.registerSingleton(Olympus);
container.registerSingleton(NeutralinoFileSystem);
container.registerSingleton(NeutralinoOS);
container.registerSingleton(Zip_Go);
container.registerInstance(Sqlite_Go, new Sqlite_Go('./TheCelesteTrackerTestDb.db', container.resolve(NeutralinoOS), container.resolve(NeutralinoFileSystem)));

const GetDependency = container.resolve.bind(container);

export { GetDependency as get, GetDependency };

