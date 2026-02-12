import { createInterface } from 'node:readline/promises';
export async function promptUser({ prompt, values, defValue }) {
    return new Promise(async (resolve) => {
        const readline = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        let promptText = prompt;
        values.forEach((value, index) => {
            promptText += `${index ? ", " : " "}${index + 1}. ${value}${value === defValue ? " (def)" : ""}`;
        });
        promptText += ": ";
        const _answer = await readline.question(promptText).catch(() => process.exit(1));
        const answer = _answer?.toLowerCase().trim();
        if (!answer && defValue) {
            readline.close();
            resolve(defValue);
            return;
        }
        if (["quit", "q", "exit", "x"].includes(answer)) {
            console.log("Exiting...");
            process.exit(1);
        }
        const index = values.includes(answer)
            ? values.indexOf(answer)
            : +answer - 1;
        const value = values[index];
        if (answer && !value) {
            console.warn("\tInvalid value: " + answer);
            process.exit(1);
        }
        readline.close();
        resolve(value);
    });
}
