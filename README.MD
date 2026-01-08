# rpg-sage-creative/dev-scripts

This repo is merely a reusable collection of the various util/ci/cd scripts used by all RPG Sage Creative repos.

## mjs

These are called by the `.sh` scripts to do heavy lifting that is easier in NodeJS than in Bash.

### mjs/index.mjs

This script is the entry point for the other `.mjs` scripts.
The first arg indicates which of the others scripts will be called.
The remaining args are passed along as either string args or flag keys.

### mjs/indexTs.mjs

This script creates an index.ts file in every folder under `src` *not* named `internal`.
This file includes an `export * from ...` line for each ts file in the folder and every child folder *not* named `internal`.

### mjs/testJs.mjs

This script scans the `src` folder for any `.ts` file that doesn't have a corresponding `.test.js` file in the `test` folder.
For each missing test file, one is created with a `test.todo("FILENAME")` so that Jest can pick it up.

## sh

### build.sh

Performs a build of the `src` folder.
This includes deleting all prior `build` folders and `.tsbuildinfo` files.
It also triggers `mjs/indexTs.mjs` before starting the build unless `--skipIndexTs` is passed.
The build runs twice: once to build all `.js` files and a second time to redo the `.d.ts` files w/o private/internal functions.
Optionally can "refresh" `node_modules` and `package-lock.json` if `--refreshNodeModules` is passed.

### create-test-js.sh

Triggers the `mjs/testJs.mjs` script.

### release.sh

Tricks a version release.
First performs a complete build and test.
Checks for files that need to be checked in or pushed.
Creates a release branch, bumps version number, then merges it to main and back to develop.

### test.sh

Triggers Jest unit testing.
If a specific file is given, then only that file is tested.
If given a `.ts` file, then a build is triggered before running the tests for the given file.