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

# get the right scripts folder
SCRIPT_DIR="."
if [ -d "./node_modules/@rpg-sage-creative/dev-scripts" ]; then
	SCRIPT_DIR="./node_modules/@rpg-sage-creative/dev-scripts"
fi
INDEX_MJS="$SCRIPT_DIR/mjs/index.mjs"

# create all the .test.js files ...
echo "Generating .test.js files ..."
node "$INDEX_MJS" testJs -r
if [ "$?" != "0" ]; then echo ".test.js Generation Failed!"; exit 1; fi
