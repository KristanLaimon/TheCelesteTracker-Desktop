// NODE.JS/BUN/DENO ONLY
import "reflect-metadata";

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { container } from "tsyringe";
import Sqlite_Go from "../dependencies/exports/Sqlite_Go";
import Zip_Go from "../dependencies/exports/Zip_Go";
import ImageCacheService from "../src/api/ImageCacheService";
import { CTDB_Token, IFileSystem_Token, IOs_Token, IPath_Token, IThreadConstructor_Token } from "../src/core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../src/core/interfaces/IFileSystem";
import type { IOS } from "../src/core/interfaces/IOs";
import type { IPath } from "../src/core/interfaces/IPath";
import { CreateTrackerDb } from "../src/db/SqliteGoDialect";
import Celeste from "../src/domain/Celeste";
import Configuration from "../src/domain/Configuration";
import Everest from "../src/domain/Everest";
import { CollabUtils2Scanner } from "../src/domain/Everest.collabutils2";
import { DialogReader } from "../src/domain/Everest.dialog";
import Olympus from "../src/domain/Olympus";
import { Construct_LocalMods } from "../src/setup.DI.helpers";
import { BunThread } from "./helpers/BunThread";
import NodeJsFileSystem from "./helpers/NodeJsFileSystem";
import NodeJsOS from "./helpers/NodeJsOs";
import NodeJsPath from "./helpers/NodeJsPath";

export const TEST_FOLDER = join(import.meta.dir);
export const TEST_TEMP_FOLDER = join(TEST_FOLDER, "./temp");
export const ROOT_FOLDER = join(TEST_FOLDER, "..");
export const ROOT_BIN = join(ROOT_FOLDER, "bin");
export const TEST_CELESTE_PATH = join(ROOT_FOLDER, "dependencies/integration-tests/mocks/Celeste");
export const TEST_OLYMPUS_PATH = join(ROOT_FOLDER, "dependencies/integration-tests/mocks/Olympus");
export const TEST_DATA_TEMP_PATH = join(TEST_FOLDER, "Data-Temp");

process.env.CTD_TEST_CELESTE_PATH = TEST_CELESTE_PATH;
process.env.CTD_TEST_OLYMPUS_PATH = TEST_OLYMPUS_PATH;
process.env.CTD_TEST_DATA_FOLDER = TEST_DATA_TEMP_PATH;

container.registerSingleton(IFileSystem_Token, NodeJsFileSystem);
container.registerSingleton(IOs_Token, NodeJsOS);
container.register(IPath_Token, { useValue: new NodeJsPath() });
container.register(IThreadConstructor_Token, { useValue: BunThread });
container.registerSingleton(Celeste);
container.registerSingleton(Configuration);
container.registerSingleton(CollabUtils2Scanner);
container.registerSingleton(DialogReader);
container.registerSingleton(Everest);
container.registerSingleton(Olympus);
container.registerSingleton(ImageCacheService);
container.registerSingleton(Zip_Go);

const os_ = container.resolve<IOS>(IOs_Token);
container.registerInstance(
	Sqlite_Go,
	new Sqlite_Go(join(TEST_FOLDER, "test_with_data.db"), os_, container.resolve<IFileSystem>(IFileSystem_Token), container.resolve<IPath>(IPath_Token)),
);
container.registerInstance(CTDB_Token, CreateTrackerDb(container.resolve(Sqlite_Go)));

export const GetDependency = container.resolve.bind(container);

export function GetDependencyBinaryPath(binaryName = "Sqlite"): string {
	function getBinaryFilename(): string {
		const { platform } = process;
		if (platform === "win32") return `${binaryName}-win_x64.exe`;
		if (platform === "linux") return `${binaryName}-linux_x64`;
		if (platform === "darwin") return `${binaryName}-mac_x64`;
		return `${binaryName}-win_x64.exe`;
	}
	let binaryPath = join(ROOT_FOLDER, "dependencies", getBinaryFilename());
	if (existsSync(binaryPath)) {
		return binaryPath;
	}

	console.log(`Building Go CLI helper (missing: ${binaryPath})...`);
	const result = spawnSync("bun", [join(ROOT_FOLDER, "dependencies", "build.ts")], { cwd: ROOT_FOLDER, stdio: "inherit" });
	if (result.status !== 0) {
		throw new Error("Go CLI helper build failed");
	}

	binaryPath = join(ROOT_FOLDER, "dependencies", getBinaryFilename());
	if (existsSync(binaryPath)) {
		return binaryPath;
	} else {
		throw new Error("This should not happen!");
	}
}

export function EnsureBuildAndGetPathExe(): string {
	return GetDependencyBinaryPath("Sqlite");
}

export const DB_Mods = Construct_LocalMods({ dataDir: "./testing/Data-Temp", indent: 2 });
