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

CURRENT_BRANCH=`git rev-parse --abbrev-ref HEAD`
if [ "$CURRENT_BRANCH" != "develop" ]; then
	echo "Please release from branch: develop"
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

if [ "$NO_BUILD" != "true" ]; then
	npm run build
	if [ "$?" != "0" ]; then
		echo "Build failed, cannot release $TYPE."
		exit 1
	fi
fi

if [ "$NO_TEST" != "true" ]; then
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

UPDATED_VERSION=`npm version patch --git-tag-version false`
TARGET_VERSION=${UPDATED_VERSION#v}
git restore package.json
git restore package-lock.json

if [ $(git tag -l "$UPDATED_VERSION") ]; then
	echo "Release already exists!"
	echo "Try: npm run refresh-tags"
	exit 1
fi

read -p "Do $TYPE release: $UPDATED_VERSION? ([y]es or [n]o): "
case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
	y|yes) ;;
	*) exit 1 ;;
esac

RELEASE_BRANCH="release/$TARGET_VERSION"

# step 1 - create release branch
git checkout -b "$RELEASE_BRANCH"

# step 2 - update package version
npm version "$TYPE" -m "build(versioning): Release - %s"
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

# step 3 - push updated package version
git push origin "$RELEASE_BRANCH"
if [ "$?" != "0" ]; then echo "Release Failed!"; exit 1; fi

# step 4 - merge release back into main
git checkout main && git merge "$RELEASE_BRANCH"
if [ "$?" != "0" ]; then echo "Failed merge to main!"; exit 1; fi

git push
if [ "$?" != "0" ]; then echo "Failed merge to main!"; exit 1; fi

# step 5 - merge release back into develop
git checkout develop && git merge "$RELEASE_BRANCH"
if [ "$?" != "0" ]; then echo "Failed merge to develop!"; exit 1; fi

git push
if [ "$?" != "0" ]; then echo "Failed merge to develop!"; exit 1; fi

# step 6 - refresh tags
git tag -l | xargs git tag -d
git fetch --tags

echo "Release $TARGET_VERSION ($TYPE) Done."
