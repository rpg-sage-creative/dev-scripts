import { readdirSync } from "node:fs";
import { isValidDirectory } from "./isValidDirectory.js";
import { nameSorter } from "./nameSorter.js";
export function getSubFolders(path) {
    try {
        if (isValidDirectory(path)) {
            const children = readdirSync(path);
            const filtered = children.filter(child => isValidDirectory(`${path}/${child}`));
            filtered.sort(nameSorter);
            return filtered;
        }
    }
    catch (ex) {
    }
    return [];
}
