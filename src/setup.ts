// UNIVERSAL COMPATIBILITY
import { container } from 'tsyringe';
import Sqlite_Go from '../src-utils/Sqlite_Go';
import Zip_Go from '../src-utils/Zip_Go';
import { IFileSystem_Token, IOs_Token, IPath_Token, IThreadConstructor_Token } from './interfaces/DependencyInjectionTokens';
import type { IPath } from './interfaces/IPath';
import Path from './libs/BrowserPath';
import Celeste from './libs/Celeste';
import Everest from './libs/Everest';
import { NeutralinoFileSystem } from './libs/NeutralinoFileSystem';
import { NeutralinoOS } from './libs/NeutralinoOS';
import Olympus from './libs/Olympus';
import { ThreadBrowser } from './libs/ThreadBrowser';

container.registerSingleton(IFileSystem_Token, NeutralinoFileSystem);
container.registerSingleton(IOs_Token, NeutralinoOS);
container.register(IPath_Token, { useValue: new Path() });
container.register(IThreadConstructor_Token, { useValue: ThreadBrowser });
container.registerSingleton(Celeste);
container.registerSingleton(Everest);
container.registerSingleton(Olympus);
container.registerSingleton(NeutralinoFileSystem);
container.registerSingleton(NeutralinoOS);
container.registerSingleton(Zip_Go);
container.registerInstance(Sqlite_Go, new Sqlite_Go('./TheCelesteTrackerTestDb.db', container.resolve(NeutralinoOS), container.resolve(NeutralinoFileSystem), container.resolve<IPath>(IPath_Token)));

const GetDependency = container.resolve.bind(container);

export { GetDependency as get, GetDependency };
