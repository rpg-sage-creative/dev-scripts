# rpg-sage-creative/dev-scripts

This repo is merely a reusable collection of the various util/ci/cd scripts used by all RPG Sage Creative repos.

## Entry Point

As of v1.3.0, `pnpm` (not `npm`) is the assumed package manager and all scripts should be called via `pnpm dev-scripts SCRIPT`.

## mjs

These are called by `bin.sh` to do heavy lifting that is easier in NodeJS than in Bash.

### mjs/index.mjs

This script is the entry point for the other `.mjs` scripts.
The first arg indicates which of the others scripts will be called.
The remaining args are passed along as either string args or flag keys.

### mjs/indexTs.mjs

This script creates an `index.ts` file in every folder under `src` *not* named `internal`.
The created `index.ts` file includes an `export * from ...` line for each ts file in the folder and every child folder *not* named `internal`.

> **v1.3.0 Note:**
> Index files should be created using `pnpm dev-scripts create-indexes`.

### mjs/testJs.mjs

This script scans the `src` folder for any `.ts` file that doesn't have a corresponding `.test.js` file in the `test` folder.
For each missing test file, one is created with a `test.todo("FILENAME")` so that Jest can pick it up.

> **v1.3.0 Note:**
> Test files should be created using `pnpm dev-scripts create-jest-todos`.

## sh

### bin.sh

This script is exposed such that all scripts can be called using `pnpm dev-scripts SCRIPT`.

### build.sh

Performs a build of the `src` folder.
This includes deleting all prior `build` folders and `.tsbuildinfo` files.
It also triggers `mjs/indexTs.mjs` before starting the build unless `--skipIndexTs` is passed.
The build runs twice: once to build all `.js` files and a second time to redo the `.d.ts` files w/o private/internal functions.
Optionally can "refresh" `node_modules` and `package-lock.json` if `--refreshNodeModules` is passed.

> **v1.3.0 Note:**
> Building should be triggered by `pnpm build` or tasks (cmd/ctrl+b) and use updated scripts in package.json
> See recommended "scripts" section.

### release.sh

Tricks a version release.
First performs a complete build and test.
Checks for files that need to be checked in or pushed.
Creates a release branch, bumps version number, then merges it to main and back to develop.

> **v1.3.0 Note:**
> Releases should be created using `pnpm dev-scripts release TYPE`.
> See recommended "scripts" section.

### test.sh

Triggers Jest unit testing.
If a specific file is given, then only that file is tested.
If given a `.ts` file, then a build is triggered before running the tests for the given file.

> **v1.3.0 Note:**
> Testing should be triggered by `pnpm test` or tasks (cmd/ctrl+t) and use updated scripts in package.json
> See recommended "scripts" section.

## Recommended Scripts

The following represents a great starting point for the "scripts" section of your package.json that utilizes the scripts in this repo.

```
	"scripts": {
		"scrub": "pnpm run '/^scrub::.*/'",
		"scrub::node_modules": "rm -rf node_modules",
		"scrub::npm": "rm -f package-lock.json",
		"scrub::pnpm": "rm -f pnpm-lock.yaml",
		"postscrub": "pnpm install",

		"scrubIfMissing": "[ -d './node_modules' ] && [ -f './pnpm-lock.yaml' ] || pnpm scrub",

		"prebuild": "pnpm scrubIfMissing && pnpm run '/^build::.*/'",
		"build::clean-build-folder": "rm -rf build",
		"-build::clean-build-folders": "find . -type d -name 'build' -not -path './node_modules/*' -not -path './modules/*'  -exec rm -rf {} +",
		"build::clean-build-info": "rm -f *.tsbuildinfo",
		"-build::clean-build-infos": "find . -type f -name '*.tsbuildinfo' -not -path './node_modules/*' -exec rm -rf {} +",
		"build::create-indexes": "[ -d './src' ] && pnpm dev-scripts create-indexes",
		"build": "[ -f './tsconfig.json' ] && tsc --build --force tsconfig.json",
		"postbuild": "[ -f './tsconfig.d.json' ] && tsc --build --force tsconfig.d.json",

		"buildIfMissing": "[ -d './build' ] || pnpm build",

		"build:fresh": "pnpm scrub && pnpm build",

		"pretest": "[ -d './test' ] && pnpm build && node -e \"import * as utils from './build/index.js';\"",
		"test": "[ -d './test' ] && node --no-warnings --experimental-vm-modules ./node_modules/jest/bin/jest",
		"test:one": "[ -d './test' ] && node --no-warnings --experimental-vm-modules ./node_modules/jest/bin/jest",

		"release": "pnpm dev-scripts create-release",

		"refresh-tags": "pnpm dev-scripts refresh-tags"
	},
```