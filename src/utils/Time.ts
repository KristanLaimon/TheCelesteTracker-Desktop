// UNIVERSAL COMPATIBILITY

/**
 * Converts milliseconds into a human-readable duration string.
 * Examples:
 * - 45000 -> "45s"
 * - 125000 -> "2m 05s"
 * - 4500000 -> "1h 15m 00s"
 */
export function formatPlayTime(ms: number): string {
	if (ms <= 0 || !Number.isFinite(ms)) return "0s";

	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		const padM = String(minutes).padStart(2, "0");
		const padS = String(seconds).padStart(2, "0");
		return `${hours}h ${padM}m ${padS}s`;
	}

	if (minutes > 0) {
		const padS = String(seconds).padStart(2, "0");
		return `${minutes}m ${padS}s`;
	}

	return `${seconds}s`;
}

/**
 * Formats time in milliseconds into standard timer format (e.g. for speedrun times or detailed timers).
 * Examples:
 * - 125432 -> "2:05.432"
 * - 3725432 -> "1:02:05"
 */
export function formatFormattedTime(ms: number): string {
	if (ms <= 0 || !Number.isFinite(ms)) return "0:00.000";

	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const millis = Math.floor(ms % 1000);

	const padS = String(seconds).padStart(2, "0");

	if (hours > 0) {
		const padM = String(minutes).padStart(2, "0");
		return `${hours}:${padM}:${padS}`;
	}

	const padMs = String(millis).padStart(3, "0");
	return `${minutes}:${padS}.${padMs}`;
}
