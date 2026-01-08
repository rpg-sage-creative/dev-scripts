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

# get release type and branch from args
TYPE=""
NO_BUILD=""
NO_TEST=""
while test $# -gt 0; do
	case "$1" in
		major|minor|patch) TYPE="$1"; shift; ;;
		--noBuild) NO_BUILD="true"; shift; ;;
		--noTest) NO_TEST="true"; shift; ;;
		*) shift; ;;
	esac
done

# ensure release type and branch args exist
if [ -z "$TYPE" ]; then
	echo "release.sh $TYPE"
	echo "/bin/bash release.sh major|minor|patch"
	exit 1
fi

function promptForce {
	local yn
	read -p "Force release $TYPE? (y/n) " yn
	if [ "$yn" != "y" ]; then
		exit 1
	fi
}

function lookForFilesToCommit {
	test -z `git ls-files --exclude-standard --others`
	if [ "$?" != "0" ]; then
		echo "You have untracked files, cannot release $TYPE."
		promptForce
	fi

	git diff-index --quiet --cached HEAD --
	if [ "$?" != "0" ]; then
		echo "You have uncommitted staged changes, cannot release $TYPE."
		promptForce
	fi

	git diff-files --ignore-space-at-eol --quiet
	if [ "$?" != "0" ]; then
		echo "You have unstaged changes, cannot release $TYPE."
		promptForce
	fi
}

# check before we build/run
lookForFilesToCommit

if [ ! -z "$NO_BUILD" ]; then
	npm run build
	if [ "$?" != "0" ]; then
		echo "Build failed, cannot release $TYPE."
		exit 1
	fi
fi

if [ ! -z "$NO_TEST" ]; then
	npm run test
	if [ "$?" != "0" ]; then
		echo "Test failed, cannot release $TYPE."
		exit 1
	fi
fi

# check after we build/run (in case building/testing altered files)
lookForFilesToCommit

# get the right scripts folder
SCRIPT_DIR="."
if [ -d "./node_modules/@rpg-sage-creative/dev-scripts" ]; then
	SCRIPT_DIR="./node_modules/@rpg-sage-creative/dev-scripts"
fi
INDEX_MJS="$SCRIPT_DIR/mjs/index.mjs"

TARGET_VERSION=`node $INDEX_MJS version $TYPE dry | tail -n 1`

if [ $(git tag -l "v$TARGET_VERSION") ]; then
	echo "Release already exists!"
	echo "Try: npm run refresh-tags"
	exit 1
fi

read -p "Do $TYPE release: $TARGET_VERSION? ([y]es or [n]o): "
case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
	y|yes) ;;
	*) exit 1 ;;
esac

RELEASE_BRANCH="release/$TARGET_VERSION"

# step 1 - create release branch
git checkout -b "$RELEASE_BRANCH"

# step 2 - update package version
npm version "$type"
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

# step 3 - push updated package version
git push origin "$RELEASE_BRANCH"
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

# step 4 - refresh tags
git tag -l | xargs git tag -d
git fetch --tags

# step 5 - merge release back into main
git checkout main && git merge "$RELEASE_BRANCH"
if [ "$?" != "0" ]; then echo "Failed merge to main!"; exit 1; fi

git push
if [ "$?" != "0" ]; then echo "Failed merge to main!"; exit 1; fi

# step 6 - merge release back into develop
git checkout develop && git merge "$RELEASE_BRANCH"
if [ "$?" != "0" ]; then echo "Failed merge to develop!"; exit 1; fi

git push
if [ "$?" != "0" ]; then echo "Failed merge to develop!"; exit 1; fi

echo "Release $TARGET_VERSION ($TYPE) Done."
