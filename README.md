# @umijs/tools

## Commands

### release

Publish a new version of the package.

![](https://tcc.sorrycc.com/p/14dd2af4-2ad7-4aee-9b26-5637cf927a36.png)

#### Options

- `--no-check-git-status`, skip checking if git status is clean.
- `--no-bump`, skip bumping the version.
- `--no-build`, skip building the package.
- `--bump=patch|minor|major|question default: patch`, bump the version.
- `--npm-client=npm|pnpm|yarn|bun default: pnpm`, use the specified npm client.
- `--publish-npm-client=npm|pnpm|tnpm default: npm`, use the specified npm client to publish.
- `--tag=latest|next|... default: latest or next if version is pre-release`, publish with the specified tag.
- `--git-tag=prefixed|v|false default: false`, git tag the release version.
- `--sync-deps=./templates/*/package.json`, sync the dependencies of the specified package.json. Notice: use `__utool_sync_deps_exact` in target package.json to sync exact version.
- `--sync-versions=./templates/*/package.json`, sync the versions of the specified package.json.
- `--sync-publishes=../packages/foo`, sync the publishes of the specified package.json.
- `--dry-run`, dry run the command.
- `--github-release`, publish the release to github.
- `--changelog`, generate changelog.
- `--changelog-dir=../../`, the directory of the changelog file.
- `--no-check-ownership`, skip checking if you are the owner of the package.

### bundle

#### Options

- `--mode=production|development default: production`, build mode.
- `--entry=./src/cli.ts default: ./src/cli.ts`, entry file.
- `--no-minify`, skip minify the bundle.
- `--output-path=./dist default: ./dist`, output path.
- `--patch-dirname`, patch the output file to replace "src" with "__dirname".

## LICENSE

MIT
