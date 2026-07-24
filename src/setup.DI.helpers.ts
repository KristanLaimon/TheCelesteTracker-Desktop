import { IFileSystem_Token, IPath_Token } from "./interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "./interfaces/IFileSystem";
import type { IPath } from "./interfaces/IPath";
import Everest from "./libs/Everest";
import GameBananaApi from "./libs/GameBananaAPI";
import DBMods from "./libs/LocalMods";
import MaddiesApi from "./libs/MaddiesAPI";
import Olympus from "./libs/Olympus";
import Storage, { type StorageOptions } from "./libs/Storage";
import Storage_JsonFileAdapter, { type JsonFileAdapterOptions } from "./libs/Storage.json";
import { GetDependency } from "./setup";

export function Construct_LocalMods(jsonParams: JsonFileAdapterOptions, storageParams?: Omit<StorageOptions, "adapters">) {
	const jsonAdapterPersistent = new Storage_JsonFileAdapter(jsonParams, GetDependency<IFileSystem>(IFileSystem_Token), GetDependency<IPath>(IPath_Token));
	const storage = new Storage({ adapters: [jsonAdapterPersistent], ...storageParams });

	const myMods = new DBMods(
		GetDependency(Everest),
		storage,
		GetDependency(MaddiesApi),
		GetDependency(GameBananaApi),
		GetDependency(Olympus),
		GetDependency<IFileSystem>(IFileSystem_Token),
	);
	return myMods;
}
