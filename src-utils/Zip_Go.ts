import { injectable } from 'tsyringe';
import Generic_Go from './Generic_Go';

@injectable()
export default class Zip_Go extends Generic_Go {
	private async executeInternal<R>(args: string): Promise<R> {
		const exePath = await this.GetExecutablePath();
		const cmd = `${exePath} ${args}`;

		const response = await this.os.execCommand(cmd);

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
