export function Time_FormatMsToSpeedrunStringTime(ms: number): string {
	const milliseconds = Math.floor(ms % 1000);
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor(ms / (1000 * 60 * 60));

	const hStr = hours.toString().padStart(2, "0");
	const mStr = minutes.toString().padStart(2, "0");
	const sStr = seconds.toString().padStart(2, "0");
	const msStr = milliseconds.toString().padStart(3, "0");

	if (hours > 0) return `${hStr}:${mStr}:${sStr}.${msStr}`;
	return `${mStr}:${sStr}.${msStr}`;
}
