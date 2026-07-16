const APP_NAME: string = 'TheCelesteTracker';

const silentLogsNamespaces: string[] = ['SqliteExtension', 'GoldenLayout'].map((a) => a.toLocaleLowerCase());

export function Log_Throw(throwErrorMsg: string): void {
	console.error(`[${APP_NAME}- FATALERROR]: ${throwErrorMsg}`);
	throw new Error(throwErrorMsg);
}

// biome-ignore lint/suspicious/noExplicitAny: Logging could be anything
export function Log_Info(...msgs: any[]): void {
	const finalMsg = msgs.map((a) => JSON.stringify(a, null, 2)).join(' ');
	for (const bannedNamespaceLC of silentLogsNamespaces) {
		if (finalMsg.toLowerCase().includes(bannedNamespaceLC)) return;
	}
	console.info(`[${APP_NAME}- INFO]: ${finalMsg}`);
}

// biome-ignore lint/suspicious/noExplicitAny: Logging could be anything
export function Log_Warn(...msgs: any[]): void {
	const finalMsg = msgs.map((a) => JSON.stringify(a, null, 2)).join(' ');
	for (const bannedNamespaceLC of silentLogsNamespaces) {
		if (finalMsg.toLowerCase().includes(bannedNamespaceLC)) return;
	}
	console.info(`[${APP_NAME}- WARN]: ${finalMsg}`);
}

// biome-ignore lint/suspicious/noExplicitAny: Logging could be anything
export function Log_Error(...msgs: any[]): void {
	const finalMsg = msgs.map((a) => JSON.stringify(a, null, 2)).join(' ');
	for (const bannedNamespaceLC of silentLogsNamespaces) {
		if (finalMsg.toLowerCase().includes(bannedNamespaceLC)) return;
	}
	console.info(`[${APP_NAME}- ERROR]: ${finalMsg}`);
}
