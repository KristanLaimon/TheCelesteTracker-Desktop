import 'reflect-metadata';
import { container } from 'tsyringe';
import Sqlite_Go from '../src-utils/Sqlite_Go';
import Zip_Go from '../src-utils/Zip_Go';
import { IFileSystem } from '../src/interfaces/IFileSystem';
import { IOS } from '../src/interfaces/IOs';
import Celeste from '../src/libs/Celeste';
import Everest from '../src/libs/Everest';
import Olympus from '../src/libs/Olympus';
import NodeJsFileSystem from './NodeJsFileSystem';
import NodeJsOS from './NodeJsOs';

type Constructable<T> = new (...args: never[]) => T;

container.registerSingleton(NodeJsFileSystem);
//@ts-expect-error IFileSystem is abstract, should throw error when instatiated (expected behavior), but will always be replaced due to tsringe(and to avoid using annoying DI tokens). This is perfectly ok.
container.registerInstance<IFileSystem>(IFileSystem as Constructable<IFileSystem>, container.resolve(NodeJsFileSystem));

container.registerSingleton(NodeJsOS);
//@ts-expect-error IFileSystem is abstract, should throw error when instatiated (expected behavior), but will always be replaced due to tsringe(and to avoid using annoying DI tokens). This is perfectly ok.
container.registerInstance<IOS>(IOS as Constructable<IOS>, container.resolve(NodeJsOS));

container.registerSingleton(Celeste);
container.registerSingleton(Everest);
container.registerSingleton(Olympus);
container.registerSingleton(Zip_Go);
container.registerInstance(Sqlite_Go, new Sqlite_Go('./TheCelesteTrackerTestDb.db', container.resolve(NodeJsFileSystem)));

const GetDependency = container.resolve.bind(container);

export { GetDependency };

