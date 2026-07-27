// UNIVERSAL COMPATIBILITY

import { container } from "tsyringe";
import Sqlite_Go from "../dependencies/exports/Sqlite_Go";
import Zip_Go from "../dependencies/exports/Zip_Go";
import ImageCacheService from "./api/ImageCacheService";
import Path from "./core/BrowserPath";
import { CTDB_Token, IFileSystem_Token, IOs_Token, IPath_Token, IThreadConstructor_Token } from "./core/interfaces/DependencyInjectionTokens";
import type { IPath } from "./core/interfaces/IPath";
import { NeutralinoFileSystem } from "./core/NeutralinoFileSystem";
import { NeutralinoOS } from "./core/NeutralinoOS";
import { ThreadBrowser } from "./core/ThreadBrowser";
import { CreateTrackerDb } from "./db/SqliteGoDialect";
import Celeste from "./domain/Celeste";
import Configuration from "./domain/Configuration";
import Everest from "./domain/Everest";
import Olympus from "./domain/Olympus";
import { Construct_LocalMods } from "./setup.DI.helpers";

container.registerSingleton(IFileSystem_Token, NeutralinoFileSystem);
container.registerSingleton(IOs_Token, NeutralinoOS);
container.register(IPath_Token, { useValue: new Path() });
container.register(IThreadConstructor_Token, { useValue: ThreadBrowser });
container.registerSingleton(Celeste);
container.registerSingleton(Configuration);
container.registerSingleton(Everest);
container.registerSingleton(Olympus);
container.registerSingleton(ImageCacheService);
container.registerSingleton(NeutralinoFileSystem);
container.registerSingleton(NeutralinoOS);
container.registerSingleton(Zip_Go);
container.registerInstance(
	Sqlite_Go,
	new Sqlite_Go("./TheCelesteTracker_DB.db", container.resolve(NeutralinoOS), container.resolve(NeutralinoFileSystem), container.resolve<IPath>(IPath_Token)),
);
container.registerInstance(CTDB_Token, CreateTrackerDb(container.resolve(Sqlite_Go)));

const GetDependency = container.resolve.bind(container);

const DB_Mods = Construct_LocalMods({
	dataDir: "./data",
	indent: 2,
});

export { DB_Mods, GetDependency as get, GetDependency };
