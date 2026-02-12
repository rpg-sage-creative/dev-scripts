import { existsSync, writeFileSync } from "node:fs";
import { getSubFolders } from "./internal/getSubFolders.js";
import { getTsFiles } from "./internal/getTsFiles.js";
import { isValidFile } from "./internal/isValidFile.js";
import { parseArgsAndOptions } from "./internal/parseArgsAndOptions.js";
const FileFilterRegExp = /index\.[cm]?ts/;
const ExportFileRegExp = /\.([mc])?ts/g;
function process(folderPath, recursive) {
    if (!existsSync(folderPath)) {
        return -1;
    }
    const subFilter = (name) => name !== "internal";
    const exportSubMap = (name) => `export * from "./${name}/index.js";`;
    const fileFilter = (name) => !FileFilterRegExp.test(name);
    const exportFileReplacer = (_, prefix) => `.${prefix ?? ""}js`;
    const exportFileMap = (name) => `export * from "./${name.replace(ExportFileRegExp, exportFileReplacer)}";`;
    const lines = [];
    const subNames = getSubFolders(folderPath);
    subNames.filter(subFilter).forEach(subName => {
        if (recursive) {
            if (process(`${folderPath}/${subName}`, true) > 0) {
                lines.push(exportSubMap(subName));
            }
        }
        else if (isValidFile(`${folderPath}/${subName}/index.ts`)) {
            lines.push(exportSubMap(subName));
        }
    });
    const fileNames = getTsFiles(folderPath);
    lines.push(...fileNames.filter(fileFilter).map(exportFileMap));
    if (lines.length) {
        writeFileSync(`${folderPath}/index.ts`, lines.join("\n"));
    }
    return lines.length;
}
async function main() {
    const { args, options } = parseArgsAndOptions();
    const rootPath = options.rootPath ?? args[0] ?? "./";
    const recursive = options.r ?? options.recursive ?? false;
    process(`${rootPath}/src`, !!recursive);
}
await main();
