#!/bin/bash

# ensure repo root folder
if [ ! -d "./.git" ]; then
	while [ ! -d "./.git" ]; do
		cd ..
		if [ "$(pwd)" = "/" ]; then
			echo "No .git folder found."
			exit 1
		fi
	done
	echo "cd $(pwd)"
fi

# make sure we have something to build
if [ ! -f "./tsconfig.json" ]; then
	echo "No tsconfig.json file found."
	exit 0
fi

repoName="$(basename -- "$(pwd)")"
echo "Building: $repoName ..."

REFRESH_NODE_MODULES=
SKIP_INDEX_TS=
while test $# -gt 0; do
	case "$1" in
		--skipIndexTs) SKIP_INDEX_TS="true"; shift; ;;
		--refreshNodeModules) REFRESH_NODE_MODULES="true"; shift; ;;
		*) break; ;;
	esac
done

if [ ! -z "$REFRESH_NODE_MODULES" ]; then
	echo "Refreshing node_modules ..."
	rm -rf node_modules
	rm -f package-lock.json
	npm i
fi

# scrub build folders (ignore ./node_modules and ./modules)
echo "Scrubbing build folders ..."
find . -type d -name 'build' -not -path './node_modules/*' -not -path './modules/*'  -exec rm -rf {} +

# scrub build info (ignore ./node_modules)
echo "Scrubbing tsbuildinfo files ..."
find . -type f -name '*.tsbuildinfo' -not -path './node_modules/*' -exec rm -rf {} +

# get the right scripts folder
SCRIPT_DIR="."
if [ -d "./node_modules/@rpg-sage-creative/dev-scripts" ]; then
	SCRIPT_DIR="./node_modules/@rpg-sage-creative/dev-scripts"
fi
INDEX_MJS="$SCRIPT_DIR/mjs/index.mjs"

# create all the index.ts files ... unless skipped
if [ -z "$SKIP_INDEX_TS" ]; then
	echo "Generating index.ts files ..."
	node "$INDEX_MJS" indexTs -r
	if [ "$?" != "0" ]; then echo "Build Failed!"; exit 1; fi
else
	echo "Skipping: Generating index.ts files ..."
fi

# transpile the TS
echo "Building tsconfig.json ..."
tsc --build tsconfig.json
if [ "$?" != "0" ]; then echo "Build Failed!"; exit 1; fi

# build out the .d.ts files that exclude the private/internal docs
if [ -f "./tsconfig.d.json" ]; then
	echo "Building tsconfig.d.json ..."
	tsc --build tsconfig.d.json
	if [ "$?" != "0" ]; then echo "Build Failed!"; exit 1; fi
fi

echo "Building: $repoName ... done."
