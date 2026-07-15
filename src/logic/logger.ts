const APP_NAME: string = 'TheCelesteTracker';

export function Log_Throw(throwErrorMsg: string): void {
	console.error(`[${APP_NAME}- FATALERROR]: ${throwErrorMsg}`);
	throw new Error(throwErrorMsg);
}

export function Log_Info(infoMsg: string): void {
	console.info(`[${APP_NAME}- INFO]: ${infoMsg}`);
}

export function Log_Warn(infoMsg: string): void {
	console.info(`[${APP_NAME}- WARN]: ${infoMsg}`);
}
