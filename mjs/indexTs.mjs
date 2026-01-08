import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";

/**
 * @param {string} path
 * @returns {boolean}
 */
function isValidDirectory(path) {
	try {
		const name = path.split("/").pop();
		return !name.startsWith(".") && statSync(path).isDirectory();
	}catch(ex) {
		// ignore
	}
	return false;
}

const ValidFileRegExp = /(?<!index)\.[mc]?ts$/;

/**
 * @param {string} path
 * @returns {boolean}
 */
function isValidFile(path) {
	try {
		const name = path.split("/").pop();
		return ValidFileRegExp.test(name) && statSync(path).isFile();
	}catch(ex) {
		// ignore
	}
	return false;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1}
 */
function nameSorter(a, b) {
	if (a === undefined) return 1;
	if (b === undefined) return -1;

	if (a === null) return 1;
	if (b === null) return -1;

	const aL = a.toLowerCase();
	const bL = b.toLowerCase();
	if (aL !== bL) {
		return aL < bL ? -1 : 1;
	}
	if (a !== b) {
		return a < b ? 1 : -1;
	}
	return 0;
}

/**
 * Returns all subFolder names that don't start with a period.
 * @param {string} path
 * @returns {string[]}
 */
function getSubFolders(path) {
	try {
		if (isValidDirectory(path)) {
			const children = readdirSync(path);
			const filtered = children.filter(child => isValidDirectory(`${path}/${child}`));
			filtered.sort(nameSorter);
			return filtered;
		}
	}catch (ex) {
		// ignore
	}
	return [];
}

/**
 * Returns all fileNames names that end in .ts
 * @param {string} path
 * @returns {string[]}
 */
function getTsFiles(path) {
	try {
		if (isValidDirectory(path)) {
			const children = readdirSync(path);
			const filtered = children.filter(child => isValidFile(`${path}/${child}`));
			filtered.sort(nameSorter);
			return filtered;
		}
	}catch (ex) {
		// ignore
	}
	return [];
}

const FileFilterRegExp = /index\.[cm]?ts/;
const ExportFileRegExp = /\.([mc])?ts/g;

/**
 *
 * @param {string} folderPath
 * @param {boolean} recursive
 * @returns {number} number of lines in the index.ts
 */
function process(folderPath, recursive) {
	if (!existsSync(folderPath)) {
		return -1;
	}

	/** @type {(name: string) => boolean} */
	const subFilter = name => name !== "internal";
	/** @type {(name: string) => string} */
	const exportSubMap = name => `export * from "./${name}/index.js";`;
	/** @type {(name: string) => boolean} */
	const fileFilter = name => !FileFilterRegExp.test(name);
	/** @type {(match: string, prefix: string) => string} */
	const exportFileReplacer = (_, prefix) => `.${prefix ?? ""}js`;
	/** @type {(name: string) => string} */
	const exportFileMap = name => `export * from "./${name.replace(ExportFileRegExp, exportFileReplacer)}";`;

	/** @type {string[]} */
	const lines = [];

	// process child folders if recursive
	const subNames = getSubFolders(folderPath);
	subNames.filter(subFilter).forEach(subName => {
		if (recursive) {
			if (process(`${folderPath}/${subName}`, true) > 0) {
				lines.push(exportSubMap(subName));
			}
		}else if (isValidFile(`${folderPath}/${subName}/index.ts`)) {
			lines.push(exportSubMap(subName));
		}
	});

	// process child files
	const fileNames = getTsFiles(folderPath);
	lines.push(...fileNames.filter(fileFilter).map(exportFileMap));

	// write file
	if (lines.length) {
		writeFileSync(`${folderPath}/index.ts`, lines.join("\n"));
	}

	// return line count
	return lines.length;
}

/**
 * Looks in rootPath/types and updates index.ts to export all contents from all other .ts files.
 * @param {string[]} args
 * @param {{ r?:boolean; recursive?:boolean; rootPath?:string; }} options
 */
export function indexTs(args, options) {
	const rootPath = options.rootPath ?? args[0] ?? "./";
	const recursive = options.r ?? options.recursive ?? false;
	process(`${rootPath}/src`, recursive);
}
