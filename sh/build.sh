#!/bin/bash

SCRUB=
SKIP_INDEX_TS=
while test $# -gt 0; do
	case "$1" in
		--skipIndexTs) SKIP_INDEX_TS="true"; shift; ;;
		--refreshNodeModules|--scrub) SCRUB="true"; shift; ;;
		*) shift; ;;
	esac
done

function scrub {
	rm -rf node_modules package-lock.json pnpm-lock.yaml
	pnpm install
}

function scrubIfMissing {
	[ -d './node_modules' ] && [ -f './pnpm-lock.yaml' ] || scrub
}

function build {
	scrubIfMissing
	find . -type d -name 'build' -not -path './node_modules/*' -not -path './modules/*'  -exec rm -rf {} +
	find . -type f -name '*.tsbuildinfo' -not -path './node_modules/*' -exec rm -rf {} +
	if [ -z "$SKIP_INDEX_TS" ]; then
		pnpm dev-scripts create-indexes
	fi
	tsc --build --force tsconfig.json
	tsc --build --force tsconfig.d.json
}

function buildFresh {
	scrub
	build
}

if [ ! -z "$SCRUB" ]; then
	scrub
fi

build

repoName="$(basename -- "$(pwd)")"
echo "Building: $repoName ... done."
