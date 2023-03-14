#!/usr/bin/env bash

# List of branches to include in integrations branch
branches[0]="fix-sso-query-params"
branches[1]="close-room-screens"
branches[2]="only-start-after-sw"
branches[3]="fix-normalizing-of-homeserver"
branches[4]="peeking_with_guest_login"


# Temporarily add remotes (easier to add them temporarily than to figure out whether you have them and by what name)
origin="AutomatticHydrogen"
upstream="VectorHydrogen"
git remote add $origin git@github.com:Automattic/hydrogen-web.git
git remote add $upstream git@github.com:vector-im/hydrogen-web.git
git fetch "$origin" > /dev/null 2>&1
git fetch "$upstream" > /dev/null 2>&1

# Ensure we're on master and up-to-date
echo "> Updating local master branch from upstream"
git checkout -q master
git pull "$upstream" master

# (Re)-Create a new integrations branch
echo "> Re-creating integrations branch"
git branch -D integrations
git checkout -b integrations

# Loop over branch list
for branch in "${branches[@]}"
do

	# create local branch if we don't already have
	if ! git show-ref refs/heads/"$branch"; then
		echo "Creating local branch $branch"
		git branch --track "$branch" "$origin"/"$branch"
	fi

	printf "\n> Merging branch [%s]\n" "$branch"

	git merge --no-ff --no-edit "$branch"

done

git push -fu "$origin" integrations
printf "\n> Deployed to origin remote\n"

git checkout -q master

# Remove remotes
git remote remove "$origin"
git remote remove "$upstream"
