const APP_NAME: string = 'TheCelesteTracker';

const silentLogsNamespaces: string[] = ['SqliteExtension', 'GoldenLayout'].map((a) => a.toLocaleLowerCase());

export function Log_Throw(throwErrorMsg: string): void {
	console.error(`[${APP_NAME}- FATALERROR]: ${throwErrorMsg}`);
	throw new Error(throwErrorMsg);
}

// Helper to safely check messages against banned namespaces without breaking object references
// biome-ignore lint/suspicious/noExplicitAny: Logging could be anything
function isSilenced(msgs: any[]): boolean {
	const filterString = msgs
		.map((a) => {
			try {
				return typeof a === 'object' ? JSON.stringify(a) : String(a);
			} catch {
				return '[Unserializable]';
			}
		})
		.join(' ')
		.toLocaleLowerCase();

	for (const bannedNamespaceLC of silentLogsNamespaces) {
		if (filterString.includes(bannedNamespaceLC)) return true;
	}
	return false;
}

// biome-ignore lint/suspicious/noExplicitAny: Logging could be anything
export function Log_Info(...msgs: any[]): void {
	if (isSilenced(msgs)) return;
	console.info(`[${APP_NAME}- INFO]:`, ...msgs);
}

// biome-ignore lint/suspicious/noExplicitAny: Logging could be anything
export function Log_Warn(...msgs: any[]): void {
	if (isSilenced(msgs)) return;
	console.warn(`[${APP_NAME}- WARN]:`, ...msgs);
}

// biome-ignore lint/suspicious/noExplicitAny: Logging could be anything
export function Log_Error(...msgs: any[]): void {
	if (isSilenced(msgs)) return;
	console.error(`[${APP_NAME}- ERROR]:`, ...msgs);
}
