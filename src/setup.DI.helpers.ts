import Zip_Go from "../dependencies/exports/Zip_Go";
import GameBananaApi from "./api/GameBananaAPI";
import MaddiesApi from "./api/MaddiesAPI";
import { IFileSystem_Token, IPath_Token } from "./core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "./core/interfaces/IFileSystem";
import type { IPath } from "./core/interfaces/IPath";
import Celeste from "./domain/Celeste";
import Everest from "./domain/Everest";
import DBMods from "./domain/LocalMods";
import Olympus from "./domain/Olympus";
import { GetDependency } from "./setup";
import Storage, { type StorageOptions } from "./utils/Storage";
import Storage_JsonFileAdapter from "./utils/Storage.json";

export interface LocalModsStorageOptions {
	/** Directory the split `mods-*.json` cache files live in, e.g. `"./data"`. */
	dataDir: string;
	indent?: number;
}

export function Construct_LocalMods(options: LocalModsStorageOptions, storageParams?: Omit<StorageOptions, "adapters">) {
	const fs = GetDependency<IFileSystem>(IFileSystem_Token);
	const path = GetDependency<IPath>(IPath_Token);

	type SplitFiles = Record<"installed" | "historical" | "enrichment" | "collectibleTotals", string>;
	const SPLIT_FILES: SplitFiles = {
		installed: "mods-installed.json",
		historical: "mods-historical.json",
		enrichment: "mods-enrichment.json",
		collectibleTotals: "mods-collectibletotals.json",
	};

	// Not awaited here so `Construct_LocalMods` can stay synchronous like before the split;
	// each adapter awaits this same promise itself before its first real disk access (see `readyPromise`).

	const makeStorage = (fileName: string) =>
		new Storage({
			adapters: [new Storage_JsonFileAdapter({ filePath: path.join(options.dataDir, fileName), indent: options.indent }, fs, path)],
			...storageParams,
		});

	const storages = {
		installed: makeStorage(SPLIT_FILES.installed),
		historical: makeStorage(SPLIT_FILES.historical),
		enrichment: makeStorage(SPLIT_FILES.enrichment),
		collectibleTotals: makeStorage(SPLIT_FILES.collectibleTotals),
	};

	const myMods = new DBMods(
		GetDependency(Everest),
		storages,
		GetDependency(MaddiesApi),
		GetDependency(GameBananaApi),
		GetDependency(Olympus),
		fs,
		GetDependency(Celeste),
		GetDependency(Zip_Go),
	);
	return myMods;
}
