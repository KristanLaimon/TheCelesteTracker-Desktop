import path from "node:path";
import type { IPath } from "../../src/interfaces/IPath";

export default class NodeJsPath implements IPath {
	resolve = path.posix.resolve;
	normalize = path.posix.normalize;
	isAbsolute = path.posix.isAbsolute;
	join = path.posix.join;
	relative = path.posix.relative;
	dirname = path.posix.dirname;
	basename = path.posix.basename;
	extname = path.posix.extname;
	format = path.posix.format;
	parse = path.posix.parse;
	sep = path.posix.sep;
	delimiter = path.posix.delimiter;
	posix = path.posix;
}
