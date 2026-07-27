/**
 * Session helper utilities for formatting date, side name, and chapter name.
 */

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Returns a human-friendly relative time string (e.g. "3 days ago", "2 hours ago", "just now").
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined, opts?: { now?: Date }): string {
	if (!dateInput) return "";
	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
	if (Number.isNaN(date.getTime())) return "";

	const now = opts?.now ?? new Date();
	const diffMs = now.getTime() - date.getTime();

	if (diffMs < 0) return "in the future";

	const diffSec = Math.floor(diffMs / 1000);
	if (diffSec < 60) return "just now";

	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? "min" : "mins"} ago`;

	const diffHour = Math.floor(diffMin / 60);
	if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`;

	const diffDay = Math.floor(diffHour / 24);
	if (diffDay < 30) return `${diffDay} ${diffDay === 1 ? "day" : "days"} ago`;

	const diffMonth = Math.floor(diffDay / 30);
	if (diffMonth < 12) return `${diffMonth} ${diffMonth === 1 ? "month" : "months"} ago`;

	const diffYear = Math.floor(diffDay / 365);
	return `${diffYear} ${diffYear === 1 ? "year" : "years"} ago`;
}

/**
 * Formats an ISO date string or Date object into a human readable date string with relative time.
 * Example: "Jul 24, 2026 13:30 (3 days ago)"
 */
export function formatSessionDate(
	dateInput: string | Date | null | undefined,
	opts?: { includeRelative?: boolean; includeTime?: boolean; now?: Date },
): string {
	if (!dateInput) return "—";
	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
	if (Number.isNaN(date.getTime())) return "—";

	const includeRelative = opts?.includeRelative ?? true;
	const includeTime = opts?.includeTime ?? true;

	const month = MONTH_NAMES[date.getMonth()];
	const day = date.getDate();
	const year = date.getFullYear();

	let formattedDate = `${month} ${day}, ${year}`;
	if (includeTime) {
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		formattedDate += ` ${hours}:${minutes}`;
	}

	if (includeRelative) {
		const relative = formatRelativeTime(date, { now: opts?.now });
		if (relative) {
			return `${formattedDate} (${relative})`;
		}
	}

	return formattedDate;
}

/**
 * Normalizes side ID string (e.g., "SIDEA", "0", "A") to user-friendly label ("A-Side", "B-Side", "C-Side").
 */
export function formatSideName(sideId: string | null | undefined): string {
	if (!sideId) return "A-Side";
	const upper = sideId.trim().toUpperCase();
	if (upper === "SIDEA" || upper === "0" || upper === "A") return "A-Side";
	if (upper === "SIDEB" || upper === "1" || upper === "B") return "B-Side";
	if (upper === "SIDEC" || upper === "2" || upper === "C") return "C-Side";
	return sideId;
}

/**
 * Extracts a readable chapter name from a chapter SID.
 * Example: "BeefyUncleTorre/map" -> "map"
 */
export function formatChapterName(chapterSid: string | null | undefined): string {
	if (!chapterSid) return "—";
	const parts = chapterSid.split("/");
	if (parts.length > 1) {
		return parts.slice(1).join("/");
	}
	return chapterSid;
}
