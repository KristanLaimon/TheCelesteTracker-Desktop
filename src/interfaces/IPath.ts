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

export interface IPath {
	resolve(...pathSegments: string[]): string;
	normalize(path: string): string;
	isAbsolute(path: string): boolean;
	join(...paths: string[]): string;
	relative(from: string, to: string): string;
	dirname(path: string): string;
	basename(path: string, ext?: string): string;
	extname(path: string): string;
	format(pathObject: FormatInputPathObject): string;
	parse(path: string): ParsedPath;
	sep: string;
	delimiter: string;
	posix: Omit<IPath, "posix">;
}
