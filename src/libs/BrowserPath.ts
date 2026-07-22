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

function assertPath(path: unknown): asserts path is string {
	if (typeof path !== 'string') {
		throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
	}
}

function normalizeString(path: string, allowAboveRoot: boolean): string {
	let res = '';
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let code = 0;
	for (let i = 0; i <= path.length; ++i) {
		if (i < path.length) {
			code = path.charCodeAt(i);
		} else if (code === 47) {
			break;
		} else {
			code = 47;
		}

		if (code === 47) {
			if (lastSlash === i - 1 || dots === 1) {
			} else if (lastSlash !== i - 1 && dots === 2) {
				if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
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
		} else if (code === 46 && dots !== -1) {
			++dots;
		} else {
			dots = -1;
		}
	}
	return res;
}

function getCwd(): string {
	if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
		return process.cwd();
	}
	return '/';
}

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

export default class BrowserPath implements IPath {
	readonly sep = '/';
	readonly delimiter = ':';

	get posix(): IPath {
		return this;
	}

	resolve(...pathSegments: string[]): string {
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

			if (path.length === 0) {
				continue;
			}

			resolvedPath = `${path}/${resolvedPath}`;
			resolvedAbsolute = path.charCodeAt(0) === 47;
		}

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

	normalize(path: string): string {
		assertPath(path);

		if (path.length === 0) return '.';

		const hasBackslash = path.includes('\\');
		const normalPath = hasBackslash ? path.replace(/\\/g, '/') : path;

		const isPosixAbs = normalPath.charCodeAt(0) === 47;
		const isWinAbs = /^[A-Za-z]:[/]/.test(normalPath);
		const isAbs = isPosixAbs || isWinAbs;
		const trailingSeparator = !isWinAbs && normalPath.charCodeAt(normalPath.length - 1) === 47;

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

	isAbsolute(path: string): boolean {
		assertPath(path);
		return path.length > 0 && path.charCodeAt(0) === 47;
	}

	join(...paths: string[]): string {
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
		const normalized = this.normalize(joined);
		if (hasBackslash) {
			return normalized.replace(/\//g, '\\');
		}
		return normalized;
	}

	relative(from: string, to: string): string {
		assertPath(from);
		assertPath(to);

		if (from === to) return '';

		const resolvedFrom = this.resolve(from);
		const resolvedTo = this.resolve(to);

		if (resolvedFrom === resolvedTo) return '';

		let fromStart = 1;
		for (; fromStart < resolvedFrom.length; ++fromStart) {
			if (resolvedFrom.charCodeAt(fromStart) !== 47) break;
		}
		const fromEnd = resolvedFrom.length;
		const fromLen = fromEnd - fromStart;

		let toStart = 1;
		for (; toStart < resolvedTo.length; ++toStart) {
			if (resolvedTo.charCodeAt(toStart) !== 47) break;
		}
		const toEnd = resolvedTo.length;
		const toLen = toEnd - toStart;

		const length = fromLen < toLen ? fromLen : toLen;
		let lastCommonSep = -1;
		let i = 0;
		for (; i <= length; ++i) {
			if (i === length) {
				if (toLen > length) {
					if (resolvedTo.charCodeAt(toStart + i) === 47) {
						return resolvedTo.slice(toStart + i + 1);
					}
					if (i === 0) {
						return resolvedTo.slice(toStart + i);
					}
				} else if (fromLen > length) {
					if (resolvedFrom.charCodeAt(fromStart + i) === 47) {
						lastCommonSep = i;
					} else if (i === 0) {
						lastCommonSep = 0;
					}
				}
				break;
			}
			const fromCode = resolvedFrom.charCodeAt(fromStart + i);
			const toCode = resolvedTo.charCodeAt(toStart + i);
			if (fromCode !== toCode) break;
			if (fromCode === 47) lastCommonSep = i;
		}

		let out = '';
		let j = fromStart + lastCommonSep + 1;
		for (; j <= fromEnd; ++j) {
			if (j === fromEnd || resolvedFrom.charCodeAt(j) === 47) {
				if (out.length === 0) out += '..';
				else out += '/..';
			}
		}

		if (out.length > 0) return out + resolvedTo.slice(toStart + lastCommonSep);
		toStart += lastCommonSep;
		if (resolvedTo.charCodeAt(toStart) === 47) ++toStart;
		return resolvedTo.slice(toStart);
	}

	dirname(path: string): string {
		assertPath(path);
		if (path.length === 0) return '.';
		const hasBackslash = path.includes('\\');
		const normalPath = hasBackslash ? path.replace(/\\/g, '/') : path;
		let code = normalPath.charCodeAt(0);
		const hasRoot = code === 47 || /^[A-Za-z]:[/]/.test(normalPath);
		let end = -1;
		let matchedSlash = true;
		for (let i = normalPath.length - 1; i >= 1; --i) {
			code = normalPath.charCodeAt(i);
			if (code === 47) {
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

	basename(path: string, ext?: string): string {
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
				if (code === 47) {
					if (!matchedSlash) {
						start = i + 1;
						break;
					}
				} else {
					if (firstNonSlashEnd === -1) {
						matchedSlash = false;
						firstNonSlashEnd = i + 1;
					}
					if (extIdx >= 0) {
						if (code === ext.charCodeAt(extIdx)) {
							if (--extIdx === -1) {
								end = i;
							}
						} else {
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
			if (path.charCodeAt(i) === 47) {
				if (!matchedSlash) {
					start = i + 1;
					break;
				}
			} else if (matchedSlash) {
				matchedSlash = false;
				end = i + 1;
			}
		}

		if (end === -1) return '';
		return path.slice(start, end);
	}

	extname(path: string): string {
		assertPath(path);
		let startDot = -1;
		let startPart = 0;
		let end = -1;
		let matchedSlash = true;
		let preDotState = 0;
		for (let i = path.length - 1; i >= 0; --i) {
			const code = path.charCodeAt(i);
			if (code === 47) {
				if (!matchedSlash) {
					startPart = i + 1;
					break;
				}
				continue;
			}
			if (end === -1) {
				matchedSlash = false;
				end = i + 1;
			}
			if (code === 46) {
				if (startDot === -1) startDot = i;
				else if (preDotState !== 1) preDotState = 1;
			} else if (startDot !== -1) {
				preDotState = -1;
			}
		}

		if (startDot === -1 || end === -1 || preDotState === 0 || (preDotState === 1 && startDot === startPart && startDot === end - 1)) {
			return '';
		}
		return path.slice(startDot, end);
	}

	format(pathObject: FormatInputPathObject): string {
		if (pathObject === null || typeof pathObject !== 'object') {
			throw new TypeError(`Parameter "pathObject" must be an object, not ${typeof pathObject}`);
		}
		return _format('/', pathObject);
	}

	parse(path: string): ParsedPath {
		assertPath(path);

		const ret: ParsedPath = { root: '', dir: '', base: '', ext: '', name: '' };
		if (path.length === 0) return ret;
		let code = path.charCodeAt(0);
		const isAbsolute = code === 47;
		const start = isAbsolute ? 1 : 0;
		if (isAbsolute) {
			ret.root = '/';
		}
		let startDot = -1;
		let startPart = 0;
		let end = -1;
		let matchedSlash = true;
		let i = path.length - 1;

		let preDotState = 0;
		for (; i >= start; --i) {
			code = path.charCodeAt(i);
			if (code === 47) {
				if (!matchedSlash) {
					startPart = i + 1;
					break;
				}
				continue;
			}
			if (end === -1) {
				matchedSlash = false;
				end = i + 1;
			}
			if (code === 46) {
				if (startDot === -1) startDot = i;
				else if (preDotState !== 1) preDotState = 1;
			} else if (startDot !== -1) {
				preDotState = -1;
			}
		}

		if (startDot === -1 || end === -1 || preDotState === 0 || (preDotState === 1 && startDot === startPart && startDot === end - 1)) {
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
}
