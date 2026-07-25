// UNIVERSAL COMPATIBILITY

export interface SimilarityOptions {
	/**
	 * Whether the comparison should be case-sensitive.
	 * @default false
	 */
	caseSensitive?: boolean;

	/**
	 * Whether to trim whitespace from both ends of the strings before comparison.
	 * @default true
	 */
	trimWhitespace?: boolean;
}

/**
 * Calculates the similarity score between two strings (ranging from 0.0 to 1.0).
 * 1.0 means identical strings, 0.0 means completely dissimilar.
 */
export function StringSimilarity_SearchThroughSingleText(str1: string, str2: string, options: SimilarityOptions = {}): number {
	const { caseSensitive = false, trimWhitespace = true } = options;

	let s1 = str1;
	let s2 = str2;

	if (trimWhitespace) {
		s1 = s1.trim();
		s2 = s2.trim();
	}

	if (!caseSensitive) {
		s1 = s1.toLowerCase();
		s2 = s2.toLowerCase();
	}

	if (s1 === s2) return 1.0;
	if (s1.length === 0 || s2.length === 0) return 0.0;

	const m = s1.length;
	const n = s2.length;

	// Create a 2D array for Levenshtein distance calculation
	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

	for (let i = 0; i <= m; i++) dp[i][0] = i;
	for (let j = 0; j <= n; j++) dp[0][j] = j;

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
			dp[i][j] = Math.min(
				dp[i - 1][j] + 1, // deletion
				dp[i][j - 1] + 1, // insertion
				dp[i - 1][j - 1] + cost, // substitution
			);
		}
	}

	const levenshteinDistance = dp[m][n];
	const maxLength = Math.max(m, n);

	return 1 - levenshteinDistance / maxLength;
}

export interface SearchOptions extends SimilarityOptions {
	/**
	 * Maximum number of results to return.
	 */
	limit?: number;

	/**
	 * Minimum similarity threshold (0.0 to 1.0) required to include a result.
	 * @default 0.0
	 */
	minScore?: number;
}

export interface SearchResult {
	item: string;
	score: number;
}

/**
 * Searches a list of strings against a target string and returns them
 * sorted by similarity from most similar to least similar.
 */
export function StringSimilarity_SearchThroughList(query: string, items: string[], options: SearchOptions = {}): SearchResult[] {
	const { limit, minScore = 0.0, ...similarityOptions } = options;

	const results: SearchResult[] = items.map((item) => ({
		item,
		score: StringSimilarity_SearchThroughSingleText(query, item, similarityOptions),
	}));

	// Filter out results below the minimum score threshold
	const filtered = results.filter((res) => res.score >= minScore);

	// Sort descending by score (most similar to least similar)
	filtered.sort((a, b) => b.score - a.score);

	// Apply limit if specified
	if (limit !== undefined && limit >= 0) {
		return filtered.slice(0, limit);
	}

	return filtered;
}
