// biome-ignore-all lint/style/useImportType: DI Needed
import { os } from '@neutralinojs/lib';
import { injectable } from 'tsyringe';

@injectable()
export class Zip_Go {
	private async executeInternal<R>(args: string): Promise<R> {
		let binaryName = '';
		if (window.NL_OS === 'Windows') {
			binaryName = 'utilities-win_x64.exe';
		} else if (window.NL_OS === 'Linux') {
			binaryName = 'utilities-linux_x64';
		} else if (window.NL_OS === 'Darwin') {
			binaryName = 'utilities-mac_x64';
		}

		// Helper binary is located directly along the main executable (which is window.NL_PATH)
		const helperPath = `"${window.NL_PATH}/${binaryName}"`;
		const cmd = `${helperPath} ${args}`;

		const response = await os.execCommand(cmd);

		if (response.exitCode !== 0) {
			try {
				const parsed = JSON.parse(response.stdOut);
				if (parsed && typeof parsed === 'object' && 'success' in parsed && !parsed.success) {
					throw new Error(parsed.error || 'Zip operation failed');
				}
			} catch {}
			throw new Error(response.stdErr || `Zip helper exited with code ${response.exitCode}`);
		}

		const parsed = JSON.parse(response.stdOut);
		if (!parsed.success) {
			throw new Error(parsed.error || 'Zip operation failed');
		}
		return parsed as R;
	}

	public async readTextFile(zipPath: string, filePath: string): Promise<string> {
		const res = await this.executeInternal<{ content: string }>(`zip read --zip "${zipPath}" --file "${filePath}"`);
		return res.content;
	}

	public async list(zipPath: string): Promise<string[]> {
		const res = await this.executeInternal<{ files: string[] }>(`zip list --zip "${zipPath}"`);
		return res.files;
	}

	public async unzip(zipPath: string, destPath: string): Promise<void> {
		await this.executeInternal<void>(`zip unzip --zip "${zipPath}" --dest "${destPath}"`);
	}

	public async zip(srcPath: string, zipPath: string): Promise<void> {
		await this.executeInternal<void>(`zip pack --src "${srcPath}" --zip "${zipPath}"`);
	}
}
