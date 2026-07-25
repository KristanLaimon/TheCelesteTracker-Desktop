import GameBananaApi from "@api/GameBananaAPI";
import MaddiesApi from "@api/MaddiesAPI";
import { IFileSystem_Token, IPath_Token } from "@core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "@core/interfaces/IFileSystem";
import type { IPath } from "@core/interfaces/IPath";
import Everest from "@domain/Everest";
import DBMods from "@domain/LocalMods";
import Olympus from "@domain/Olympus";
import Storage, { type StorageOptions } from "@utils/Storage";
import Storage_JsonFileAdapter, { type JsonFileAdapterOptions } from "@utils/Storage.json";
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
