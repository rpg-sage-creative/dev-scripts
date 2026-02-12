import { existsSync } from "node:fs";
import { readJsonFile } from "./readJsonFile.js";
import { writeJsonFile } from "./writeJsonFile.js";
export async function writeEnvJson({ codeName, where, ghost }) {
    const configJson = await readJsonFile(`./config/config.json`).catch(() => ({})) ?? {};
    const envJson = {
        ...configJson["env"],
        ...(configJson[where] ?? {})[ghost ?? "env"],
        codeName
    };
    const filePath = where === "local" || ghost
        ? `./config/env.json`
        : `./config/env-${where}.json`;
    if (existsSync(filePath)) {
        console.log(`Overwriting: ${filePath}`);
    }
    else {
        console.log(`Writing: ${filePath}`);
    }
    await writeJsonFile(filePath, envJson);
}
