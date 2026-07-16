// biome-ignore-all lint/style/useImportType: DI Needed
import { events, extensions } from '@neutralinojs/lib';
import { injectable } from 'tsyringe';

@injectable()
export class UtilitiesExtension {
	private extensionId: string = 'utilities';
	private pendingRequests: Map<string, { resolve: Function; reject: Function }>;

	public constructor() {
		this.pendingRequests = new Map();
		events.on('zip.readTextFileResult', this.handleExtensionMessage.bind(this));
		events.on('zip.listResult', this.handleExtensionMessage.bind(this));
		events.on('zip.unzipResult', this.handleExtensionMessage.bind(this));
		events.on('zip.zipResult', this.handleExtensionMessage.bind(this));
	}

	private handleExtensionMessage(evt: CustomEvent) {
		let payload = evt.detail;
		if (typeof payload === 'string') {
			try {
				payload = JSON.parse(payload);
			} catch (err) {
				console.error('UtilitiesExtension: Failed to parse payload:', err);
				return;
			}
		}

		const reqId = payload?.reqId;
		const result = payload?.result;

		if (reqId && this.pendingRequests.has(reqId)) {
			const promise = this.pendingRequests.get(reqId)!;
			if (result?.success) {
				promise.resolve(result);
			} else {
				promise.reject(new Error(result?.error || 'Unknown error in UtilitiesExtension'));
			}
			this.pendingRequests.delete(reqId);
		}
	}

	private executeInternal<T>(event: string, data: any): Promise<T> {
		return new Promise((resolve, reject) => {
			const reqId = crypto.randomUUID();
			this.pendingRequests.set(reqId, { resolve, reject });

			extensions
				.dispatch(this.extensionId, event, {
					reqId,
					...data,
				})
				.catch((error) => {
					this.pendingRequests.delete(reqId);
					reject(error);
				});
		});
	}

	public async readTextFile(zipPath: string, filePath: string): Promise<string> {
		const res = await this.executeInternal<{ content: string }>('zip.readTextFile', { zipPath, filePath });
		return res.content;
	}

	public async list(zipPath: string): Promise<string[]> {
		const res = await this.executeInternal<{ files: string[] }>('zip.list', { zipPath });
		return res.files;
	}

	public async unzip(zipPath: string, destPath: string): Promise<void> {
		await this.executeInternal<void>('zip.unzip', { zipPath, destPath });
	}

	public async zip(srcPath: string, zipPath: string): Promise<void> {
		await this.executeInternal<void>('zip.zip', { srcPath, zipPath });
	}
}
