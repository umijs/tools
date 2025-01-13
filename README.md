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

### bundle

#### Options

- `--mode=production|development default: production`, build mode.
- `--entry=./src/cli.ts default: ./src/cli.ts`, entry file.
- `--no-minify`, skip minify the bundle.
- `--output-path=./dist default: ./dist`, output path.
- `--patch-dirname`, patch the output file to replace "src" with "__dirname".

## LICENSE

MIT
