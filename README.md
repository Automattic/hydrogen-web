# Hydrogen's internal fork

We maintain this fork to be able to use it as a dependency in [Chatrix](https://github.com/Automattic/Chatrix) without waiting on upstream to merge PRs. This enables us to use those unmerged PRs in Chatrix right away.

We have a script `recreate_integrations_branch.sh` in the root of the repository that will recreate the `integrations` branch from the `master` branch every time it runs (our master is always synced with upstream's `master` branch).

Script includes a list of GIT branches that we want to be merged in the newly created `integrations` branch off `master` and are merged in the order of their listing.
