// NODE.JS/BUN/DENO ONLY
import 'reflect-metadata';

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { container } from 'tsyringe';
import { IFileSystem_Token, IOs_Token, IPath_Token, IThreadConstructor_Token } from '../src/interfaces/DependencyInjectionTokens';
import type { IFileSystem } from '../src/interfaces/IFileSystem';
import type { IOS } from '../src/interfaces/IOs';
import type { IPath } from '../src/interfaces/IPath';
import { BunThread } from '../src/libs/BunThread';
import Celeste from '../src/libs/Celeste';
import Everest from '../src/libs/Everest';
import { CollabUtils2Scanner } from '../src/libs/Everest.collabutils2';
import { DialogReader } from '../src/libs/Everest.dialog';
import Olympus from '../src/libs/Olympus';
import Sqlite_Go from '../src-utils/Sqlite_Go';
import Zip_Go from '../src-utils/Zip_Go';
import NodeJsFileSystem from './NodeJsFileSystem';
import NodeJsOS from './NodeJsOs';
import NodeJsPath from './NodeJsPath';

export const TEST_FOLDER = join(import.meta.dir);
export const TEST_TEMP_FOLDER = join(TEST_FOLDER, './temp');
export const ROOT_FOLDER = join(TEST_FOLDER, '..');
export const ROOT_BIN = join(ROOT_FOLDER, 'bin');

container.registerSingleton(IFileSystem_Token, NodeJsFileSystem);
container.registerSingleton(IOs_Token, NodeJsOS);
container.register(IPath_Token, { useValue: new NodeJsPath() });
container.register(IThreadConstructor_Token, { useValue: BunThread });
container.registerSingleton(Celeste);
container.registerSingleton(CollabUtils2Scanner);
container.registerSingleton(DialogReader);
container.registerSingleton(Everest);
container.registerSingleton(Olympus);
container.registerSingleton(Zip_Go);

const os_ = container.resolve<IOS>(IOs_Token);
container.registerInstance(
	Sqlite_Go,
	new Sqlite_Go(join(TEST_FOLDER, 'test_with_data.db'), os_, container.resolve<IFileSystem>(IFileSystem_Token), container.resolve<IPath>(IPath_Token)),
);

export const GetDependency = container.resolve.bind(container);

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
