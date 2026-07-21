import { IFileSystem_Token, IPath_Token } from "./interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "./interfaces/IFileSystem";
import type { IPath } from "./interfaces/IPath";
import Everest from "./libs/Everest";
import LocalMods from "./libs/LocalMods";
import MaddiesApi from "./libs/MaddiesAPI";
import Storage, { type StorageOptions } from "./libs/Storage";
import Storage_JsonFileAdapter, { type JsonFileAdapterOptions } from "./libs/Storage.json";
import Storage_LocalStorageAdapter from "./libs/Storage.localStorage";
import { GetDependency } from "./setup";

export function Construct_LocalMods(jsonParams: JsonFileAdapterOptions, storageParams?: Omit<StorageOptions, "adapters">) {
  const mapAdapterCache = new Storage_LocalStorageAdapter
  const jsonAdapterPersistent = new Storage_JsonFileAdapter(jsonParams, GetDependency<IFileSystem>(IFileSystem_Token), GetDependency<IPath>(IPath_Token));
  const storage = new Storage({adapters:[mapAdapterCache, jsonAdapterPersistent], ...storageParams});

  const myMods = new LocalMods(GetDependency(Everest), storage, GetDependency(MaddiesApi));
  return myMods;
}