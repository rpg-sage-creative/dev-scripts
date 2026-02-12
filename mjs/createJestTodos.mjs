import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { getSubFolders } from "./internal/getSubFolders.js";
import { getTsFiles } from "./internal/getTsFiles.js";
import { parseArgsAndOptions } from "./internal/parseArgsAndOptions.js";
const IndexFilterRegExp = /index\.[cm]?ts$/;
const DotTsExtRegExp = /\.[cm]?ts$/;
function createTodo(path, name) {
    let output = [];
    const pathParts = path.split("/").filter(s => s);
    while (pathParts.length && pathParts[0] !== "src")
        pathParts.shift();
    pathParts.shift();
    if (!pathParts.length) {
        pathParts.push(name);
    }
    let tabCount = 0;
    pathParts.forEach(part => {
        const tabs = "".padStart(tabCount, "\t");
        output.push(`${tabs}describe("${part}", () => {`);
        tabCount++;
    });
    const tabs = "".padStart(tabCount, "\t");
    output.push(`${tabs}test.todo("${name}");`);
    while (tabCount--) {
        const tabs = "".padStart(tabCount, "\t");
        output.push(`${tabs}});`);
    }
    return output.join("\n");
}
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
            mkdirSync(testFolderPath, { recursive: true });
            writeFileSync(testFileName, createTodo(folderPath, fileNameRoot));
        }
    });
    if (recursive) {
        getSubFolders(folderPath).forEach(pathName => process(`${folderPath}/${pathName}`, true));
    }
}
async function main() {
    const { args, options } = parseArgsAndOptions();
    const rootPath = options.rootPath ?? args[0] ?? "./";
    const recursive = options.r ?? options.recursive ?? false;
    const folderPath = `${rootPath}/src`.replaceAll("//", "/");
    process(folderPath, !!recursive);
}
await main();
