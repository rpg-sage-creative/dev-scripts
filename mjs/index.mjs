import { indexTs } from "./indexTs.mjs";
import { testJs } from "./testJs.mjs";

/**
 * Creates a Record of flag keys where the value is the number of dashes at the beginning of the flag.
 * @param {string[]} args
 * @returns {Record<string, number>}
 */
function parseFlags(args) {
	const filtered = args.filter(arg => arg.startsWith("-") && !arg.includes("="));
	return filtered.reduce((flags, flag) => {
		let count = 0;
		while (flag.startsWith("-")) {
			count++;
			flag = flag.slice(1);
		}
		flags[flag] = count;
		return flags;
	}, {});
}

/**
 * @param {string[]} args
 * @returns {Record<string, string>}
 */
function parsePairs(args) {
	const filtered = args.filter(arg => arg.includes("="));
	const pairs = filtered.map((input) => {
		const index = input.indexOf("=");
		return { key:input.slice(0, index), value:input.slice(index + 1) };
	});
	return pairs.reduce((args, pair) => {
		args[pair.key] = pair.value;
		return args;
	}, {});
}

async function runCommand() {
	/** @type {string} */
	const command = process.argv[2];

	const input = process.argv.slice(3);
	const args = input.filter(arg => !arg.startsWith("-") && !arg.includes("="));
	const pairs = parsePairs(input);
	const flags = parseFlags(input);
	const options = { ...pairs, ...flags };

	try {
		switch(command) {
			case "indexTs":
				return indexTs(args, options);
			case "testJs":
				return testJs(args, options);
			default:
				console.error(`Invalid command: ${command}`);
				console.log({argv:process.argv,command,args,options});
				process.exit(1);
		}
	}catch(ex) {
		console.error(`Unhandled Exception processing: ${command}`);
		console.log({argv:process.argv,command,args,options});
		console.error(ex);
		process.exit(1);
	}
}

runCommand();
