// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: DI Needed

import { inject, injectable } from "tsyringe";
import { IFileSystem_Token, IOs_Token, IPath_Token } from "../src/core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../src/core/interfaces/IFileSystem";
import type { IOS } from "../src/core/interfaces/IOs";
import type { IPath } from "../src/core/interfaces/IPath";

const windows_name = "utilities-win_x64.exe";
const macos_name = "utilities-mac_x64";
const linux_name = "utilities-linux_x64";

/**
 * Should be in "./" if in production.
 * Should be in "./bin" if in development
 */
const possibleParentFolders = ["./", "./bin"];

@injectable()
export default class Generic_Go {
	#executableCachedPath: string | null = null;

	constructor(
		@inject(IOs_Token) protected os: IOS,
		@inject(IFileSystem_Token) protected fs: IFileSystem,
		@inject(IPath_Token) protected path: IPath,
	) {}

	public async GetExecutablePath(): Promise<string> {
		if (this.#executableCachedPath) {
			return this.#executableCachedPath;
		}

		const util_file_name: string = (() => {
			switch (this.os.getCurrentOS()) {
				case "windows":
					return windows_name;
				case "macos":
					return macos_name;
				case "linux":
					return linux_name;
				case "freebsd":
				case "unknown":
					throw new Error(`Generic_Go: When trying to get utilities exe path. Current os '${this.os.getCurrentOS()} not supportedd. Aborting | Fatal error'`);
			}
		})();

		const currentExePath = await this.fs.getAbsolutePath(".");
		const triedPaths: string[] = [];
		for (const folder of possibleParentFolders) {
			const pathToSearchOn: string = this.path.join(currentExePath, folder, util_file_name);
			if (await this.fs.exists(pathToSearchOn)) {
				this.#executableCachedPath = pathToSearchOn;
				return this.#executableCachedPath;
			} else {
				triedPaths.push(pathToSearchOn);
			}
		}

		throw new Error(`Generic_Go: Executable not found. Tried Paths: ${JSON.stringify(triedPaths, null, 2)}`);
	}
}
