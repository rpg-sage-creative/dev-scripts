#!/bin/bash

# echo "The script you are running has:"
# echo "basename: [$(basename "$0")]"
# echo "dirname : [$(dirname "$0")]"
# echo "pwd     : [$(pwd)]"

SH_PATH=$(dirname "$0")
MJS_PATH="$SH_PATH/../mjs"

WHICH="$1"
# echo "WHICH=$WHICH"

FLAG="$2"
# echo "FLAG=$FLAG"

if [ "$WHICH" == "create-indexes" ]; then
	node "$MJS_PATH/createIndexes.mjs" "$@"

elif [ "$WHICH" == "create-jest-todos" ]; then
	node "$MJS_PATH/createJestTodos.mjs" "$@"

elif [ "$WHICH" == "create-release" ]; then
	/bin/bash "$SH_PATH/release.sh" "$@"

elif [ "$WHICH" == "deploy" ]; then
	node "$MJS_PATH/deploy.mjs" "$@"

elif [ "$WHICH" == "refresh-tags" ]; then
	git tag -l | xargs git tag -d
	git fetch --tags

elif [ "$WHICH" == "write-env-json" ]; then
	node "$MJS_PATH/writeEnvJson.mjs" "$@"

# old/deprecated build/test
elif [ "$WHICH" == "build" ]; then
	echo "DEPRECATED: update your package.json scripts"
	/bin/bash "$SH_PATH/build.sh" "$@"

elif [ "$WHICH" == "test" ]; then
	echo "DEPRECATED: update your package.json scripts"
	/bin/bash "$SH_PATH/test.sh" "$@"

else
	echo "dev-scripts usage:"
	echo "    pnpm dev-scripts create-indexes"
	echo "    pnpm dev-scripts create-jest-todos"
	echo "    pnpm dev-scripts create-release"
	echo "    pnpm dev-scripts deploy"
	echo "    pnpm dev-scripts refresh-tags"
	echo "    pnpm dev-scripts write-env-json"
	echo "dev-scripts usage (deprecated):"
	echo "    pnpm dev-scripts build"
	echo "    pnpm dev-scripts test"
fi
