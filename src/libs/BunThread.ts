import type { IThread } from '../interfaces/IThread';

export class BunThread implements IThread {
	private worker: Worker | null = null;

	constructor(url?: string | URL, _options?: { type?: string }) {
		if (typeof Worker !== 'undefined') {
			try {
				this.worker = new Worker(url ?? '', { type: 'module' });
			} catch {
				this.worker = null;
			}
		}
	}

	postMessage(message: any): void {
		if (this.worker) this.worker.postMessage(message);
	}

	addEventListener(type: 'message' | 'error', listener: (event: any) => void): void {
		if (this.worker) this.worker.addEventListener(type, listener as EventListener);
	}

	removeEventListener(type: 'message' | 'error', listener: (event: any) => void): void {
		if (this.worker) this.worker.removeEventListener(type, listener as EventListener);
	}

	terminate(): void {
		if (this.worker) { this.worker.terminate(); this.worker = null; }
	}
}
