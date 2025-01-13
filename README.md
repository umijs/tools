# @umijs/tools

## Commands

### release

Publish a new version of the package.

#### Options

- `--no-check-git-status`, skip checking if git status is clean.
- `--no-bump`, skip bumping the version.
- `--no-build`, skip building the package.
- `--bump=patch|minor|major|question default: patch`, bump the version.
- `--npm-client=npm|pnpm|yarn|bun default: pnpm`, use the specified npm client.
- `--tag=latest|next|... default: latest or next if version is pre-release`, publish with the specified tag.
- `--git-tag`, git tag the release version.

## LICENSE

MIT
