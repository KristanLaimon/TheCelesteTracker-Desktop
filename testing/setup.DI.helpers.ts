import { IFileSystem_Token, IPath_Token } from "../src/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../src/interfaces/IFileSystem";
import type { IPath } from "../src/interfaces/IPath";
import Everest from "../src/libs/Everest";
import LocalMods from "../src/libs/LocalMods";
import Olympus from "../src/libs/Olympus";
import Storage from "../src/libs/Storage";
import Storage_JsonFileAdapter from "../src/libs/Storage.json";
import { GetDependency } from "./setup";
import Storage_SimpleMapAdapter from "./Storage.simpleMap";

export function Construct_LocalMods(opts: [] | ConstructorParameters<typeof Storage> = []) {
  const mapAdapterCache = new Storage_SimpleMapAdapter();
  const jsonAdapterPersistent = new Storage_JsonFileAdapter({filePath: "./testing/mods-names.json", indent: 2}, GetDependency<IFileSystem>(IFileSystem_Token), GetDependency<IPath>(IPath_Token));
  const storage = new Storage({adapters:[mapAdapterCache, jsonAdapterPersistent], ...opts[0]});

  const myMods = new LocalMods(GetDependency(Olympus), GetDependency(Everest), storage);
  return myMods;
}