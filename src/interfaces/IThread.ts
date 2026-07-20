export interface IThread {
	postMessage(message: any): void;
	addEventListener(type: 'message' | 'error', listener: (event: any) => void): void;
	removeEventListener(type: 'message' | 'error', listener: (event: any) => void): void;
	terminate(): void;
}

export interface IThreadConstructor {
	new (url: string | URL, options?: { type?: string }): IThread;
}

export const IThreadConstructor_Token = Symbol('IThreadConstructor');
