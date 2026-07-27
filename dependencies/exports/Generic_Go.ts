// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: DI Needed

import { inject, injectable } from "tsyringe";
import { IFileSystem_Token, IOs_Token, IPath_Token } from "../../src/core/interfaces/DependencyInjectionTokens";
import type { IFileSystem } from "../../src/core/interfaces/IFileSystem";
import type { IOS } from "../../src/core/interfaces/IOs";
import type { IPath } from "../../src/core/interfaces/IPath";

const possibleParentFolders = ["./dependencies", "./dependencies/build", "./", "./bin"];

@injectable()
export default class Generic_Go {
	#executableCachedPaths: Map<string, string> = new Map();

	constructor(
		@inject(IOs_Token) protected os: IOS,
		@inject(IFileSystem_Token) protected fs: IFileSystem,
		@inject(IPath_Token) protected path: IPath,
	) {}

	public async GetExecutablePath(binaryBaseName = "Sqlite"): Promise<string> {
		const cached = this.#executableCachedPaths.get(binaryBaseName);
		if (cached) {
			return cached;
		}

		const suffix: string = (() => {
			switch (this.os.getCurrentOS()) {
				case "windows":
					return "-win_x64.exe";
				case "macos":
					return "-mac_x64";
				case "linux":
					return "-linux_x64";
				case "freebsd":
				case "unknown":
					throw new Error(`Generic_Go: Current OS '${this.os.getCurrentOS()}' not supported.`);
			}
		})();

		const util_file_name = `${binaryBaseName}${suffix}`;
		const currentExePath = await this.fs.getAbsolutePath(".");
		const triedPaths: string[] = [];
		for (const folder of possibleParentFolders) {
			const pathToSearchOn: string = this.path.join(currentExePath, folder, util_file_name);
			if (await this.fs.exists(pathToSearchOn)) {
				this.#executableCachedPaths.set(binaryBaseName, pathToSearchOn);
				return pathToSearchOn;
			}
			triedPaths.push(pathToSearchOn);
		}

		throw new Error(`Generic_Go: Executable for '${binaryBaseName}' not found. Tried paths: ${JSON.stringify(triedPaths, null, 2)}`);
	}
}
