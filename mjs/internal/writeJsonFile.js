import { writeFile } from "node:fs";
export async function writeJsonFile(filePathAndName, content) {
    return new Promise((resolve, reject) => writeFile(filePathAndName, JSON.stringify(content, undefined, "\t"), error => error ? reject(error) : resolve(true)));
}
