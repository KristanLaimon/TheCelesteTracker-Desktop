// NODE.JS/BUN/DENO ONLY
import "reflect-metadata";

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import ImageCacheService from "@api/ImageCacheService";
import { IFileSystem_Token, IOs_Token, IPath_Token, IThreadConstructor_Token, Kysely_Token } from "@core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "@core/interfaces/IFileSystem";
import type { IOS } from "@core/interfaces/IOs";
import type { IPath } from "@core/interfaces/IPath";
import { CreateTrackerDb } from "@db/SqliteGoDialect";
import Celeste from "@domain/Celeste";
import Configuration from "@domain/Configuration";
import Everest from "@domain/Everest";
import { CollabUtils2Scanner } from "@domain/Everest.collabutils2";
import { DialogReader } from "@domain/Everest.dialog";
import Olympus from "@domain/Olympus";
import Sqlite_Go from "@go/Sqlite_Go";
import Zip_Go from "@go/Zip_Go";
import { container } from "tsyringe";
import { BunThread } from "./BunThread";
import NodeJsFileSystem from "./helpers/NodeJsFileSystem";
import NodeJsOS from "./helpers/NodeJsOs";
import NodeJsPath from "./helpers/NodeJsPath";

export const TEST_FOLDER = join(import.meta.dir);
export const TEST_TEMP_FOLDER = join(TEST_FOLDER, "./temp");
export const TEST_CELESTE_PATH = join(TEST_FOLDER, "Celeste");
export const TEST_OLYMPUS_PATH = join(TEST_FOLDER, "Olympus");
export const TEST_DATA_TEMP_PATH = join(TEST_FOLDER, "Data-Temp");
export const ROOT_FOLDER = join(TEST_FOLDER, "..");
export const ROOT_BIN = join(ROOT_FOLDER, "bin");

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
container.registerInstance(Kysely_Token, CreateTrackerDb(container.resolve(Sqlite_Go)));

export const GetDependency = container.resolve.bind(container);

export function EnsureBuildAndGetPathExe(): string {
	function getBinaryName(): string {
		const { platform } = process;
		if (platform === "win32") return "utilities-win_x64.exe";
		if (platform === "linux") return "utilities-linux_x64";
		if (platform === "darwin") return "utilities-mac_x64";
		return "utilities-win_x64.exe";
	}
	let binaryPath = join(ROOT_FOLDER, "bin", getBinaryName());
	if (existsSync(binaryPath)) {
		return binaryPath;
	}

	console.log(`Building Go CLI helper (missing: ${binaryPath})...`);
	const result = spawnSync("bun", ["run", "build"], { cwd: ROOT_FOLDER, stdio: "inherit" });
	if (result.status !== 0) {
		throw new Error("Go CLI helper build failed");
	}

	binaryPath = join(ROOT_FOLDER, "bin", getBinaryName());
	if (existsSync(binaryPath)) {
		return binaryPath;
	} else {
		throw new Error("This should not happen!");
	}
}
