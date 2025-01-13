import "zx/globals";
import getGitRepoInfo from 'git-repo-info';
import assert from 'assert';

/**
 * release
 * release --no-bump
 * release --no-build
 * release --no-check-git-status
 * release --bump=patch|minor|major|question default: patch
 * release --npm-client=npm|pnpm|yarn|bun default: pnpm
 * release --tag=latest|next|... default: latest or next if version is pre-release
 */

export async function run(argv: any) {
  const cwd = process.cwd();
  const pkg = getPkg(cwd);
  const npmClient = argv.npmClient || "pnpm";
  const isMonorepo = fs.existsSync(path.join(cwd, "pnpm-workspace.yaml"))
    || fs.existsSync(path.join(cwd, "../pnpm-workspace.yaml"))
    || fs.existsSync(path.join(cwd, "../../pnpm-workspace.yaml"));
  const { branch } = getGitRepoInfo();

  console.log(`cwd: ${cwd}`);
  console.log(`npmClient: ${npmClient}`);
  console.log(`isMonorepo: ${isMonorepo}`);
  console.log(`branch: ${branch}`);

  if (argv.checkGitStatus !== false) {
    console.log('Checking if git status is clean...');
    const isGitClean = (await $`git status --porcelain`).stdout.trim().length;
    assert(!isGitClean, 'git status is not clean');
  }

  // check package access
  const pkgAccess = pkg.publishConfig?.access;
  const isScoped = pkg.name.startsWith('@');
  if (isScoped) {
    assert(pkgAccess === 'public', 'package access is not public');
  }

  if (argv.build !== false && pkg.scripts?.build) {
    console.log("Building...");
    await $`npm run build`;
  } else {
    const cue = argv.build === false
      ? "--no-build arg is specified"
      : "no build script found";
    console.log(`Skipping build since ${cue}`);
  }

  console.log("Bumping version...", argv.bump);
  const bump = await (async () => {
    if (argv.bump === false) {
      return false;
    } else {
      if (["patch", "minor", "major", "question"].includes(argv.bump)) {
        return argv.bump;
      } else if (!argv.bump) {
        return "patch";
      } else {
        throw new Error(`Invalid bump type: ${argv.bump}`);
      }
    }
  })();
  if (["patch", "minor", "major"].includes(bump)) {
    console.log(`Bumping version to ${bump}...`);
    await $`npm version ${bump}`;
  }
  if (bump === "question") {
    const newVersion = await question('Enter the new version: ');
    console.log(`Bumping version to ${newVersion}...`);
    const pkgPath = path.join(cwd, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  const newVersion = getPkg(cwd).version;
  console.log(`New version: ${newVersion}`);

  console.log("Publishing...");
  const tag = (() => {
    if (argv.tag) {
      return argv.tag;
    } else if (
      newVersion.includes('-alpha.') ||
      newVersion.includes('-beta.') ||
      newVersion.includes('-rc.')
    ) {
      return 'next';
    } else {
      return 'latest';
    }
  })();
  console.log(`Publishing with tag: ${tag}`);
  await $`npm publish --tag ${tag}`;

  if (bump) {
    console.log('Adding to git...');
    await $`${npmClient} install`;
    await $`git add ./`;
    const commitMessage = isMonorepo
      ? `release: ${pkg.name}@${newVersion}`
      : `release: ${newVersion}`;
    await $`git commit -m "${commitMessage}" -n`;
  }

  console.log("Pushing to git...");
  await $`git push origin ${branch} --tags`;

  console.log(`Published ${pkg.name}@${newVersion}`);
}

function getPkg(cwd: string) {
  const pkgPath = path.join(cwd, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  return pkg;
}
