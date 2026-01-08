import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";

const ValidDirectoryRegExp = /^(?<!\.)\w/;
const ValidFileRegExp = /(?<!index)\.([mc])?ts$/;
const IndexFilterRegExp = /index\.[cm]?ts$/;
const DotTsExtRegExp = /\.[cm]?ts$/;

/**
 * @param {string} path
 * @returns {boolean}
 */
function isValidDirectory(path) {
	try {
		const name = path.split("/").pop();
		return ValidDirectoryRegExp.test(name) && statSync(path).isDirectory();
	}catch(ex) {
		// ignore
	}
	return false;
}

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
 * Returns all subFolder names that don't start with a period.
 * @param {string} path
 * @returns {string[]}
 */
function getSubFolders(path) {
	try {
		if (isValidDirectory(path)) {
			const children = readdirSync(path);
			const filtered = children.filter(child => isValidDirectory(`${path}/${child}`));
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
			return filtered;
		}
	}catch (ex) {
		// ignore
	}
	return [];
}

function createTodo(path, name) {
	let output = [];

	// split path
	const pathParts = path.split("/");
	// start from `src`; remove all ./ or ../ or anything else before /src/
	while (pathParts.length && pathParts[0] !== "src") pathParts.shift();
	// remove `src` to start walking path
	pathParts.shift();

	// if we are in root, use name for the base describe()
	if (!pathParts.length) {
		pathParts.push(name);
	}

	let tabCount = 0;

	// describe each child folder and count tabs
	pathParts.forEach(part => {
		const tabs = "".padStart(tabCount, "\t");
		output.push(`${tabs}describe("${part}", () => {`);
		tabCount++;
	});

	// add todo
	const tabs = "".padStart(tabCount + 1, "\t");
	output.push(`${tabs}test.todo("${name}");`);

	// close each describe block
	while (tabCount--) {
		const tabs = "".padStart(tabCount, "\t");
		output.push(`${tabs}});`);
	}

	return output.join("\n");
}

/**
 *
 * @param {string} folderPath
 * @param {boolean} recursive
 */
function process(folderPath, recursive) {
	if (!existsSync(folderPath)) {
		return;
	}

	const fileNames = getTsFiles(folderPath);

	fileNames.filter(name => !IndexFilterRegExp.test(name)).forEach(fileName => {
		const testFolderPath = folderPath.replace("/src", "/test");
		const fileNameRoot = fileName.replace(DotTsExtRegExp, "");
		const testFileName = `${testFolderPath}/${fileNameRoot}.test.js`;
		if (!existsSync(testFileName)) {
			mkdirSync(testFolderPath, { recursive:true });
			writeFileSync(testFileName, createTodo(folderPath, fileNameRoot));
		}
	});

	if (recursive) {
		getSubFolders(folderPath).forEach(pathName => process(`${folderPath}/${pathName}`, true));
	}
}

/**
 * Looks for any .ts file that doesn't have a corresponding .test.js file in the /tests folder and creates one with a todo.
 * @param {string[]} args
 * @param {{ r?:boolean; recursive?:boolean; rootPath?:string; }} options
 */
export function testJs(args, options) {
	const rootPath = options.rootPath ?? args[0] ?? "./";
	const recursive = options.r ?? options.recursive ?? false;
	const folderPath = `${rootPath}/src`.replaceAll("//", "/");
	process(folderPath, recursive);
}
