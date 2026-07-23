import { IFileSystem_Token, IPath_Token } from "../src/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../src/interfaces/IFileSystem";
import type { IPath } from "../src/interfaces/IPath";
import Everest from "../src/libs/Everest";
import GameBananaApi from "../src/libs/GameBananaAPI";
import DBMods from "../src/libs/LocalMods";
import MaddiesApi from "../src/libs/MaddiesAPI";
import Storage, { type StorageOptions } from "../src/libs/Storage";
import Storage_JsonFileAdapter from "../src/libs/Storage.json";
import { GetDependency } from "./setup";

export function Construct_LocalMods(opts?: StorageOptions) {
	const jsonAdapterPersistent = new Storage_JsonFileAdapter(
		{ filePath: "./data/BROWSER-LOCAL-MODS.json", indent: 2 },
		GetDependency<IFileSystem>(IFileSystem_Token),
		GetDependency<IPath>(IPath_Token),
	);
	const storage = new Storage({ adapters: [jsonAdapterPersistent], ...opts });

	const myMods = new DBMods(GetDependency(Everest), storage, GetDependency(MaddiesApi), GetDependency(GameBananaApi));
	return myMods;
}
