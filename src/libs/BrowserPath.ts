// UNIVERSAL COMPATIBILITY
/**
 * @module Path.ts
 * @description 'path' module extracted from Node.js (POSIX implementation)
 *  Adapted for TypeScript and ECMA-sh browser environments.
 *
 * Biome.js current rules compliant!
 *
 * @author KristanLaimon (port-only), credits to original authors of Node.js version..
 * @year 2026
 * @copyright Same as Node.js
 */

import type { IPath } from '../interfaces/IPath';

export interface FormatInputPathObject {
	dir?: string;
	root?: string;
	base?: string;
	name?: string;
	ext?: string;
}

export interface ParsedPath {
	root: string;
	dir: string;
	base: string;
	ext: string;
	name: string;
}

/**
 * Asserts that the given value is a string. Throws a TypeError if it is not.
 *
 * @param path The value to assert.
 */
function assertPath(path: unknown): asserts path is string {
	if (typeof path !== 'string') {
		throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
	}
}

/**
 * Resolves '.' and '..' segments in a path according to POSIX rules.
 *
 * @param path The path string to resolve.
 * @param allowAboveRoot Whether to allow navigating above the root directory (producing '..').
 * @returns The resolved path string.
 */
function normalizeString(path: string, allowAboveRoot: boolean): string {
	let res = '';
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let code = 0;
	for (let i = 0; i <= path.length; ++i) {
		if (i < path.length) {
			code = path.charCodeAt(i);
		} else if (code === 47 /* / */) {
			break;
		} else {
			code = 47 /* / */;
		}

		if (code === 47 /* / */) {
			if (lastSlash === i - 1 || dots === 1) {
				// NOOP
			} else if (lastSlash !== i - 1 && dots === 2) {
				if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /* . */ || res.charCodeAt(res.length - 2) !== 46 /* . */) {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf('/');
						if (lastSlashIndex !== res.length - 1) {
							if (lastSlashIndex === -1) {
								res = '';
								lastSegmentLength = 0;
							} else {
								res = res.slice(0, lastSlashIndex);
								lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
							}
							lastSlash = i;
							dots = 0;
							continue;
						}
					} else if (res.length === 2 || res.length === 1) {
						res = '';
						lastSegmentLength = 0;
						lastSlash = i;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					if (res.length > 0) {
						res += '/..';
					} else {
						res = '..';
					}
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) {
					res += `/${path.slice(lastSlash + 1, i)}`;
				} else {
					res = path.slice(lastSlash + 1, i);
				}
				lastSegmentLength = i - lastSlash - 1;
			}
			lastSlash = i;
			dots = 0;
		} else if (code === 46 /* . */ && dots !== -1) {
			++dots;
		} else {
			dots = -1;
		}
	}
	return res;
}

/**
 * Resolves the current working directory.
 * Falls back to '/' if process.cwd() is not available (browser context).
 *
 * @returns The current working directory string.
 */
function getCwd(): string {
	if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
		return process.cwd();
	}
	return '/';
}

/**
 * Resolves a sequence of paths or path segments into an absolute path.
 *
 * @param pathSegments A sequence of paths or path segments.
 * @returns The resolved absolute path.
 */
export function resolve(...pathSegments: string[]): string {
	let resolvedPath = '';
	let resolvedAbsolute = false;

	for (let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
		let path: string;
		if (i >= 0) {
			path = pathSegments[i];
		} else {
			path = getCwd();
		}

		assertPath(path);

		// Skip empty entries
		if (path.length === 0) {
			continue;
		}

		resolvedPath = `${path}/${resolvedPath}`;
		resolvedAbsolute = path.charCodeAt(0) === 47 /* / */;
	}

	// At this point the path should be resolved to a full absolute path and
	// any extra / and . or .. segments filtered out.
	resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);

	if (resolvedAbsolute) {
		if (resolvedPath.length > 0) {
			return `/${resolvedPath}`;
		}
		return '/';
	}
	if (resolvedPath.length > 0) {
		return resolvedPath;
	}
	return '.';
}

/**
 * Normalizes the given path, resolving '..' and '.' segments.
 *
 * @param path The path to normalize.
 * @returns The normalized path string.
 */
export function normalize(path: string): string {
	assertPath(path);

	if (path.length === 0) return '.';

	const hasBackslash = path.includes('\\');
	const normalPath = hasBackslash ? path.replace(/\\/g, '/') : path;

	const isPosixAbs = normalPath.charCodeAt(0) === 47 /* / */;
	const isWinAbs = /^[A-Za-z]:[/]/.test(normalPath);
	const isAbs = isPosixAbs || isWinAbs;
	const trailingSeparator = !isWinAbs && normalPath.charCodeAt(normalPath.length - 1) === 47 /* / */;

	const normalized = normalizeString(normalPath, !isAbs);

	let result: string;
	if (normalized.length === 0 && !isAbs) {
		result = '.';
	} else {
		result = normalized;
		if (result.length > 0 && trailingSeparator) {
			result += '/';
		}
	}

	if (isPosixAbs) {
		result = `/${result}`;
	}

	if (hasBackslash) {
		result = result.replace(/\//g, '\\');
	}

	return result;
}

/**
 * Determines if the given path is an absolute path.
 *
 * @param path The path to check.
 * @returns True if the path is absolute, otherwise false.
 */
export function isAbsolute(path: string): boolean {
	assertPath(path);
	return path.length > 0 && path.charCodeAt(0) === 47 /* / */;
}

/**
 * Joins all given path segments together using '/' as a delimiter,
 * then normalizes the resulting path.
 *
 * @param paths A sequence of path segments to join.
 * @returns The joined and normalized path string.
 */
export function join(...paths: string[]): string {
	if (paths.length === 0) return '.';
	let joined: string | undefined;
	let hasBackslash = false;
	for (let i = 0; i < paths.length; ++i) {
		let arg = paths[i];
		assertPath(arg);
		if (arg.length > 0) {
			if (arg.includes('\\')) {
				hasBackslash = true;
				arg = arg.replace(/\\/g, '/');
			}
			if (joined === undefined) {
				joined = arg;
			} else {
				joined += `/${arg}`;
			}
		}
	}
	if (joined === undefined) return '.';
	const normalized = normalize(joined);
	if (hasBackslash) {
		return normalized.replace(/\//g, '\\');
	}
	return normalized;
}

/**
 * Resolves the relative path from one directory to another.
 *
 * @param from The start directory path.
 * @param to The target directory path.
 * @returns The relative path from `from` to `to`.
 */
export function relative(from: string, to: string): string {
	assertPath(from);
	assertPath(to);

	if (from === to) return '';

	const resolvedFrom = resolve(from);
	const resolvedTo = resolve(to);

	if (resolvedFrom === resolvedTo) return '';

	// Trim any leading backslashes
	let fromStart = 1;
	for (; fromStart < resolvedFrom.length; ++fromStart) {
		if (resolvedFrom.charCodeAt(fromStart) !== 47 /* / */) break;
	}
	const fromEnd = resolvedFrom.length;
	const fromLen = fromEnd - fromStart;

	// Trim any leading backslashes
	let toStart = 1;
	for (; toStart < resolvedTo.length; ++toStart) {
		if (resolvedTo.charCodeAt(toStart) !== 47 /* / */) break;
	}
	const toEnd = resolvedTo.length;
	const toLen = toEnd - toStart;

	// Compare paths to find the common prefix
	const length = fromLen < toLen ? fromLen : toLen;
	let lastCommonSep = -1;
	let i = 0;
	for (; i <= length; ++i) {
		if (i === length) {
			if (toLen > length) {
				if (resolvedTo.charCodeAt(toStart + i) === 47 /* / */) {
					// We reach the end of the common path of `from`
					// We, therefore, found a mismatch
					return resolvedTo.slice(toStart + i + 1);
				}
				if (i === 0) {
					// We reach the end of the common path of `from`
					// We, therefore, found a mismatch
					// but from is '/'
					return resolvedTo.slice(toStart + i);
				}
			} else if (fromLen > length) {
				if (resolvedFrom.charCodeAt(fromStart + i) === 47 /* / */) {
					// We reach the end of the common path of `to`
					// We, therefore, found a mismatch
					lastCommonSep = i;
				} else if (i === 0) {
					// We reach the end of the common path of `to`
					// We, therefore, found a mismatch
					// but to is '/'
					lastCommonSep = 0;
				}
			}
			break;
		}
		const fromCode = resolvedFrom.charCodeAt(fromStart + i);
		const toCode = resolvedTo.charCodeAt(toStart + i);
		if (fromCode !== toCode) break;
		if (fromCode === 47 /* / */) lastCommonSep = i;
	}

	let out = '';
	// Check to see if we have a common part
	let j = fromStart + lastCommonSep + 1;
	for (; j <= fromEnd; ++j) {
		if (j === fromEnd || resolvedFrom.charCodeAt(j) === 47 /* / */) {
			if (out.length === 0) out += '..';
			else out += '/..';
		}
	}

	// Finally, append the rest of the destination path
	if (out.length > 0) return out + resolvedTo.slice(toStart + lastCommonSep);
	toStart += lastCommonSep;
	if (resolvedTo.charCodeAt(toStart) === 47 /* / */) ++toStart;
	return resolvedTo.slice(toStart);
}

/**
 * Returns the directory name of a path, similar to the Unix dirname command.
 *
 * @param path The path to evaluate.
 * @returns The directory name of the path.
 */
export function dirname(path: string): string {
	assertPath(path);
	if (path.length === 0) return '.';
	const hasBackslash = path.includes('\\');
	const normalPath = hasBackslash ? path.replace(/\\/g, '/') : path;
	let code = normalPath.charCodeAt(0);
	const hasRoot = code === 47 /* / */ || /^[A-Za-z]:[/]/.test(normalPath);
	let end = -1;
	let matchedSlash = true;
	for (let i = normalPath.length - 1; i >= 1; --i) {
		code = normalPath.charCodeAt(i);
		if (code === 47 /* / */) {
			if (!matchedSlash) {
				end = i;
				break;
			}
		} else {
			matchedSlash = false;
		}
	}

	if (end === -1) return hasRoot ? '/' : '.';
	if (hasRoot && end === 1) return '//';
	let result = normalPath.slice(0, end);
	if (hasBackslash) {
		result = result.replace(/\//g, '\\');
	}
	return result;
}

/**
 * Returns the last portion of a path, similar to the Unix basename command.
 *
 * @param path The path to evaluate.
 * @param ext Optional file extension to filter out from the result.
 * @returns The basename of the path.
 */
export function basename(path: string, ext?: string): string {
	if (ext !== undefined) assertPath(ext);
	assertPath(path);

	let start = 0;
	let end = -1;
	let matchedSlash = true;

	if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
		if (ext.length === path.length && ext === path) return '';
		let extIdx = ext.length - 1;
		let firstNonSlashEnd = -1;
		for (let i = path.length - 1; i >= 0; --i) {
			const code = path.charCodeAt(i);
			if (code === 47 /* / */) {
				// If we reached a slash and our progress in matches is greater than 0,
				// then we assume we've matched the whole slash-separated segment
				if (!matchedSlash) {
					start = i + 1;
					break;
				}
			} else {
				if (firstNonSlashEnd === -1) {
					// We've seen a non-slash character, keep track of our slash-free end
					matchedSlash = false;
					firstNonSlashEnd = i + 1;
				}
				if (extIdx >= 0) {
					if (code === ext.charCodeAt(extIdx)) {
						if (--extIdx === -1) {
							// We've matched the extension, so now we only care about the basename
							end = i;
						}
					} else {
						// Extension mismatch, so we blow away the end detection,
						// but keep the matching-slash logic active
						extIdx = -1;
						end = firstNonSlashEnd;
					}
				}
			}
		}

		if (start === 0) end = firstNonSlashEnd;
		else if (end === -1) end = path.length;
		return path.slice(start, end);
	}
	for (let i = path.length - 1; i >= 0; --i) {
		if (path.charCodeAt(i) === 47 /* / */) {
			// If we reached a slash and our progress in matches is greater than 0,
			// then we assume we've matched the whole slash-separated segment
			if (!matchedSlash) {
				start = i + 1;
				break;
			}
		} else if (matchedSlash) {
			// We've seen a non-slash character, keep track of our slash-free end
			matchedSlash = false;
			end = i + 1;
		}
	}

	if (end === -1) return '';
	return path.slice(start, end);
}

/**
 * Returns the extension of the path, from the last occurrence of the . (period) character to end of string in the last portion of the path.
 * If there is no . in the last portion of the path, or if there are no other characters other than . in the document name, an empty string is returned.
 *
 * @param path The path to evaluate.
 * @returns The extension of the path (including the '.').
 */
export function extname(path: string): string {
	assertPath(path);
	let startDot = -1;
	let startPart = 0;
	let end = -1;
	let matchedSlash = true;
	// Track the state of characters (non-slash) from the end to the beginning
	let preDotState = 0;
	for (let i = path.length - 1; i >= 0; --i) {
		const code = path.charCodeAt(i);
		if (code === 47 /* / */) {
			// If we reached a slash and our progress in matches is greater than 0,
			// then we assume we've matched the whole slash-separated segment
			if (!matchedSlash) {
				startPart = i + 1;
				break;
			}
			continue;
		}
		if (end === -1) {
			// We've seen a non-slash character, keep track of our slash-free end
			matchedSlash = false;
			end = i + 1;
		}
		if (code === 46 /* . */) {
			if (startDot === -1) startDot = i;
			else if (preDotState !== 1) preDotState = 1;
		} else if (startDot !== -1) {
			// We saw a non-dot and non-slash character before our count of dots
			preDotState = -1;
		}
	}

	if (
		startDot === -1 ||
		end === -1 ||
		// We saw a non-dot character immediately before the dot
		preDotState === 0 ||
		// The dot was the first character in the path segment
		// (e.g. .bashrc)
		(preDotState === 1 && startDot === startPart && startDot === end - 1)
	) {
		return '';
	}
	return path.slice(startDot, end);
}

/**
 * Internal helper to format a path object.
 *
 * @param sep The separator character.
 * @param pathObject The path object to format.
 * @returns The formatted path string.
 */
function _format(sep: string, pathObject: FormatInputPathObject): string {
	const dir = pathObject.dir || pathObject.root;
	const base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
	if (!dir) {
		return base;
	}
	if (dir === pathObject.root) {
		return dir + base;
	}
	return dir + sep + base;
}

/**
 * Returns a path string from an object. This is the opposite of `parse`.
 *
 * @param pathObject The path object to format.
 * @returns The formatted path string.
 */
export function format(pathObject: FormatInputPathObject): string {
	if (pathObject === null || typeof pathObject !== 'object') {
		throw new TypeError(`Parameter "pathObject" must be an object, not ${typeof pathObject}`);
	}
	return _format('/', pathObject);
}

/**
 * Returns an object whose properties represent significant elements of the path.
 *
 * @param path The path to parse.
 * @returns An object containing the root, dir, base, ext, and name of the path.
 */
export function parse(path: string): ParsedPath {
	assertPath(path);

	const ret: ParsedPath = { root: '', dir: '', base: '', ext: '', name: '' };
	if (path.length === 0) return ret;
	let code = path.charCodeAt(0);
	const isAbsolute = code === 47 /* / */;
	const start = isAbsolute ? 1 : 0;
	if (isAbsolute) {
		ret.root = '/';
	}
	let startDot = -1;
	let startPart = 0;
	let end = -1;
	let matchedSlash = true;
	let i = path.length - 1;

	// Track the state of characters (non-slash) from the end to the beginning
	let preDotState = 0;
	for (; i >= start; --i) {
		code = path.charCodeAt(i);
		if (code === 47 /* / */) {
			// If we reached a slash and our progress in matches is greater than 0,
			// then we assume we've matched the whole slash-separated segment
			if (!matchedSlash) {
				startPart = i + 1;
				break;
			}
			continue;
		}
		if (end === -1) {
			// We've seen a non-slash character, keep track of our slash-free end
			matchedSlash = false;
			end = i + 1;
		}
		if (code === 46 /* . */) {
			if (startDot === -1) startDot = i;
			else if (preDotState !== 1) preDotState = 1;
		} else if (startDot !== -1) {
			// We saw a non-dot and non-slash character before our count of dots
			preDotState = -1;
		}
	}

	if (
		startDot === -1 ||
		end === -1 ||
		// We saw a non-dot character immediately before the dot
		preDotState === 0 ||
		// The dot was the first character in the path segment
		// (e.g. .bashrc)
		(preDotState === 1 && startDot === startPart && startDot === end - 1)
	) {
		if (end !== -1) {
			if (startPart === 0 && isAbsolute) {
				ret.base = ret.name = path.slice(1, end);
			} else {
				ret.base = ret.name = path.slice(startPart, end);
			}
		}
	} else {
		if (startPart === 0 && isAbsolute) {
			ret.name = path.slice(1, startDot);
			ret.base = path.slice(1, end);
		} else {
			ret.name = path.slice(startPart, startDot);
			ret.base = path.slice(startPart, end);
		}
		ret.ext = path.slice(startDot, end);
	}

	if (startPart > 0) {
		ret.dir = path.slice(0, startPart - 1);
	} else if (isAbsolute) {
		ret.dir = '/';
	}

	return ret;
}

/**
 * The platform-specific path segment separator.
 */
export const sep = '/';

/**
 * The platform-specific path delimiter.
 */
export const delimiter = ':';

/**
 * POSIX-specific path methods and properties.
 */
export const posix = {
	resolve,
	normalize,
	isAbsolute,
	join,
	relative,
	dirname,
	basename,
	extname,
	format,
	parse,
	sep,
	delimiter,
};

const pathExports: IPath = {
	resolve,
	normalize,
	isAbsolute,
	join,
	relative,
	dirname,
	basename,
	extname,
	format,
	parse,
	sep,
	delimiter,
	posix,
};

export default pathExports;
