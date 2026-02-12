import { readdirSync } from "node:fs";
import { isValidDirectory } from "./isValidDirectory.js";
import { isValidFile } from "./isValidFile.js";
import { nameSorter } from "./nameSorter.js";
export function getTsFiles(path) {
    try {
        if (isValidDirectory(path)) {
            const children = readdirSync(path);
            const filtered = children.filter(child => isValidFile(`${path}/${child}`));
            filtered.sort(nameSorter);
            return filtered;
        }
    }
    catch (ex) {
    }
    return [];
}
