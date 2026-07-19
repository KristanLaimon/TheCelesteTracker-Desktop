import 'reflect-metadata';

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { container } from 'tsyringe';
import Sqlite_Go from '../src-utils/Sqlite_Go';
import Zip_Go from '../src-utils/Zip_Go';
import { IFileSystem } from '../src/interfaces/IFileSystem';
import { IOS } from '../src/interfaces/IOs';
import Celeste from '../src/libs/Celeste';
import Everest from '../src/libs/Everest';
import Olympus from '../src/libs/Olympus';
import NodeJsFileSystem from './NodeJsFileSystem';
import NodeJsOS from './NodeJsOs';

export const TEST_FOLDER = join(import.meta.dir);
export const TEST_TEMP_FOLDER = join(TEST_FOLDER, './temp');
export const ROOT_FOLDER = join(TEST_FOLDER, '..');
export const ROOT_BIN = join(ROOT_FOLDER, 'bin');

type Constructable<T> = new (...args: never[]) => T;

container.registerSingleton(NodeJsFileSystem);
//@ts-expect-error IFileSystem is abstract, should throw error when instatiated (expected behavior), but will always be replaced due to tsringe(and to avoid using annoying DI tokens). This is perfectly ok.
container.registerInstance<IFileSystem>(IFileSystem as Constructable<IFileSystem>, container.resolve(NodeJsFileSystem));

container.registerSingleton(NodeJsOS);
//@ts-expect-error IFileSystem is abstract, should throw error when instatiated (expected behavior), but will always be replaced due to tsringe(and to avoid using annoying DI tokens). This is perfectly ok.
container.registerInstance<IOS>(IOS as Constructable<IOS>, container.resolve(NodeJsOS));

container.registerSingleton(Celeste);
container.registerSingleton(Everest);
container.registerSingleton(Olympus);
container.registerInstance(Zip_Go, new Zip_Go(container.resolve(NodeJsOS), container.resolve(NodeJsFileSystem)));
container.registerInstance(Sqlite_Go, new Sqlite_Go(join(TEST_FOLDER, 'test_with_data.db'), container.resolve(NodeJsOS), container.resolve(NodeJsFileSystem)));

const ResolveDependency = container.resolve.bind(container);

export { ResolveDependency as GetDependency };

export function EnsureBuildAndGetPathExe(): string {
	function getBinaryName(): string {
		const { platform } = process;
		if (platform === 'win32') return 'utilities-win_x64.exe';
		if (platform === 'linux') return 'utilities-linux_x64';
		if (platform === 'darwin') return 'utilities-mac_x64';
		return 'utilities-win_x64.exe';
	}
	let binaryPath = join(ROOT_FOLDER, 'bin', getBinaryName());
	if (existsSync(binaryPath)) {
		return binaryPath;
	}

	console.log(`Building Go CLI helper (missing: ${binaryPath})...`);
	const result = spawnSync('bun', ['run', 'build'], { cwd: ROOT_FOLDER, stdio: 'inherit' });
	if (result.status !== 0) {
		throw new Error('Go CLI helper build failed');
	}

	binaryPath = join(ROOT_FOLDER, 'bin', getBinaryName());
	if (existsSync(binaryPath)) {
		return binaryPath;
	} else {
		throw new Error('This should not happen!');
	}
}


