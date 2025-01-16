import "zx/globals";
import getGitRepoInfo from 'git-repo-info';
import assert from 'assert';

interface ReleaseOptions {
  npmClient?: "pnpm" | "npm" | "yarn" | "bun";
  checkGitStatus?: boolean;
  build?: boolean;
  bump?: "patch" | "minor" | "major" | "question" | false;
  tag?: string;
  gitTag?: boolean;
  syncDeps?: string;
  dryRun?: boolean;
}

export async function run(argv: ReleaseOptions) {
  const cwd = process.cwd();
  const pkg = getPkg(cwd);
  const name = pkg.name;
  assert(name, 'package.json must have name');
  const npmClient = argv.npmClient || "pnpm";
  const isMonorepo = fs.existsSync(path.join(cwd, "pnpm-workspace.yaml"))
    || fs.existsSync(path.join(cwd, "../pnpm-workspace.yaml"))
    || fs.existsSync(path.join(cwd, "../../pnpm-workspace.yaml"));
  const { branch } = getGitRepoInfo();

  console.log(`cwd: ${cwd}`);
  console.log(`npmClient: ${npmClient}`);
  console.log(`isMonorepo: ${isMonorepo}`);
  console.log(`branch: ${branch}`);

  // why check syncDeps here?
  // check should be as early as possible
  let syncDepsPackageJsons: string[] = [];
  if (argv.syncDeps) {
    const syncDeps = argv.syncDeps.split(',');
    syncDepsPackageJsons = glob.globbySync(syncDeps, {
      cwd,
      absolute: true,
    });
    syncDepsPackageJsons.forEach(p => {
      assert(p.endsWith('package.json'), `${p} specified in syncDeps must be package.json`);
      const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
      assert(pkg.dependencies?.[name] || pkg.devDependencies?.[name], `${p} must depend on ${name}`);
    });
  }

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
    if (pkg.scripts?.doctor) {
      console.log("Doctoring...");
      await $`npm run doctor`;
    }
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
      if (["patch", "minor", "major", "question"].includes(argv.bump as string)) {
        return argv.bump;
      } else if (!argv.bump) {
        return "patch";
      } else {
        throw new Error(`Invalid bump type: ${argv.bump}`);
      }
    }
  })();
  if (["patch", "minor", "major"].includes(bump as string)) {
    console.log(`Bumping version to ${bump}...`);
    if (!argv.dryRun) {
      await $`npm version ${bump} --no-commit-hooks --no-git-tag-version`;
    }
  }
  if (bump === "question") {
    const newVersion = await question('Enter the new version: ');
    console.log(`Bumping version to ${newVersion}...`);
    const pkgPath = path.join(cwd, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.version = newVersion;
    if (!argv.dryRun) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }
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
  if (!argv.dryRun) {
    await $`npm publish --tag ${tag}`;
  }

  if (argv.syncDeps) {
    console.log('Syncing dependencies...');
    syncDepsPackageJsons.forEach(p => {
      const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (pkg.dependencies?.[name]) {
        pkg.dependencies[name] = `^${newVersion}`;
      } else if (pkg.devDependencies?.[name]) {
        pkg.devDependencies[name] = `^${newVersion}`;
      }
      if (!argv.dryRun) {
        fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
      }
      console.log(`Synced ${p} to ${newVersion}`);
    });
  }

  console.log('Adding to git...');
  await $`${npmClient} install`;
  await $`git add ./`;
  try {
    if (isMonorepo) {
      if (!argv.dryRun) {
        await $`git commit -m "release: ${pkg.name}@${newVersion}" -n`;
      }
    } else {
      if (!argv.dryRun) {
        await $`git commit -m "release: ${newVersion}" -n`;
      }
    }
    if (argv.gitTag) {
      if (isMonorepo) {
        if (!argv.dryRun) {
          await $`git tag ${pkg.name}@${newVersion}`;
        }
      } else {
        if (!argv.dryRun) {
          await $`git tag ${newVersion}`;
        }
      }
    }
  } catch (e) {
    console.log('Nothing to commit, skipping...');
  }

  console.log("Pushing to git...");
  if (!argv.dryRun) {
    await $`git push origin ${branch} --tags`;
  }

  console.log(`Published ${pkg.name}@${newVersion}`);
}

function getPkg(cwd: string) {
  const pkgPath = path.join(cwd, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  return pkg;
}
