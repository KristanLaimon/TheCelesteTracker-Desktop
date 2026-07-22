// UNIVERSAL COMPATIBILITY
// biome-ignore-all lint/style/useImportType: DI Needed
import { inject, injectable } from 'tsyringe';
import { IFileSystem_Token, IOs_Token, IPath_Token } from '../interfaces/DependencyInjectionTokens';
import type { IFileSystem } from '../interfaces/IFileSystem';
import type { IOS } from '../interfaces/IOs';
import type { IPath } from '../interfaces/IPath';
import { Log_Error } from './Logger';

@injectable()
export default class ImageCacheService {
	private inFlightDownloads = new Map<string, Promise<void>>();

	constructor(
		@inject(IFileSystem_Token) private fs: IFileSystem,
		@inject(IPath_Token) private path: IPath,
		@inject(IOs_Token) private os: IOS,
	) {
		void this.path;
	}

	public async resolveCachedUrl(remoteUrl: string, diskPath: string, webUrl: string): Promise<string> {
		if (!remoteUrl || remoteUrl.trim() === '') return remoteUrl;

		try {
			const exists = await this.fs.exists(diskPath);
			if (exists) {
				return webUrl;
			}
		} catch {
			return remoteUrl;
		}

		this.downloadInBackground(remoteUrl, diskPath);
		return remoteUrl;
	}

	public downloadInBackground(remoteUrl: string, diskPath: string): Promise<void> {
		const existing = this.inFlightDownloads.get(diskPath);
		if (existing) return existing;

		const promise = (async () => {
			try {
				const parts = await this.fs.getPathParts(diskPath);
				if (parts.dir && parts.dir !== '.' && parts.dir !== '/') {
					await this.fs.createDirectory(parts.dir, { recursive: true });
				}

				let downloaded = false;
				try {
					const res = await fetch(remoteUrl);
					if (res.ok) {
						const buffer = await res.arrayBuffer();
						await this.fs.writeBinaryFile(diskPath, buffer);
						downloaded = true;
					}
				} catch {
					// Browser fetch failed (e.g. CORS block) -> fallback to cross-platform native command
				}

				if (!downloaded) {
					await this.downloadWithNativeCommand(remoteUrl, diskPath);
				}
			} catch (e: unknown) {
				Log_Error('ImageCacheService:', 'Failed background image cache download:', diskPath, e);
			}
		})().finally(() => {
			this.inFlightDownloads.delete(diskPath);
		});

		this.inFlightDownloads.set(diskPath, promise);
		return promise;
	}

	private async downloadWithNativeCommand(remoteUrl: string, diskPath: string): Promise<boolean> {
		if (!this.os) return false;
		try {
			const absPath = await this.fs.getAbsolutePath(diskPath);
			const currentOS = this.os.getCurrentOS();

			const safeUrl = remoteUrl.replace(/"/g, '\\"');
			const safePath = absPath.replace(/"/g, '\\"');

			let cmd = `curl -s -L "${safeUrl}" -o "${safePath}"`;
			if (currentOS === 'windows') {
				cmd = `curl.exe -s -L "${safeUrl}" -o "${safePath}"`;
			}

			const res = await this.os.execCommand(cmd);
			if (res.exitCode === 0 && (await this.fs.exists(diskPath))) {
				return true;
			}

			if (currentOS === 'windows') {
				const psCmd = `powershell -Command "Invoke-WebRequest -Uri '${safeUrl}' -OutFile '${safePath}'"`;
				const psRes = await this.os.execCommand(psCmd);
				if (psRes.exitCode === 0 && (await this.fs.exists(diskPath))) {
					return true;
				}
			}

			if (currentOS === 'linux' || currentOS === 'macos') {
				const wgetCmd = `wget -q -O "${safePath}" "${safeUrl}"`;
				const wgetRes = await this.os.execCommand(wgetCmd);
				if (wgetRes.exitCode === 0 && (await this.fs.exists(diskPath))) {
					return true;
				}
			}
		} catch (e: unknown) {
			Log_Error('ImageCacheService:', 'Native download error:', diskPath, e);
		}
		return false;
	}
}
