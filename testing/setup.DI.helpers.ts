import { IFileSystem_Token, IPath_Token } from "../src/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../src/interfaces/IFileSystem";
import type { IPath } from "../src/interfaces/IPath";
import Everest from "../src/libs/Everest";
import LocalMods from "../src/libs/LocalMods";
import MaddiesApi from "../src/libs/MaddiesAPI";
import Storage from "../src/libs/Storage";
import Storage_JsonFileAdapter from "../src/libs/Storage.json";
import { GetDependency } from "./setup";

export function Construct_LocalMods(opts: [] | ConstructorParameters<typeof Storage> = []) {
  const jsonAdapterPersistent = new Storage_JsonFileAdapter({filePath: "./testing/mods-names.json", indent: 2}, GetDependency<IFileSystem>(IFileSystem_Token), GetDependency<IPath>(IPath_Token));
  const storage = new Storage({adapters:[jsonAdapterPersistent], ...opts[0]});

  const myMods = new LocalMods(GetDependency(Everest), storage, GetDependency(MaddiesApi));
  return myMods;
}