import "zx/globals";
import getGitRepoInfo from 'git-repo-info';
import assert from 'assert';
import { chat } from "../libs/chat";

interface ReleaseOptions {
  npmClient?: "pnpm" | "npm" | "yarn" | "bun";
  checkGitStatus?: boolean;
  build?: boolean;
  bump?: "patch" | "minor" | "major" | "question" | false;
  tag?: string;
  gitTag?: "prefixed" | "v" | false;
  syncVersions?: string;
  syncDeps?: string;
  syncPublishes?: string;
  dryRun?: boolean;
  githubRelease?: boolean;
  changelog?: boolean;
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
  const latestTag = (await $`git describe --tags --abbrev=0`).stdout.trim();
  const repo = await getGithubRepo();
  assert(repo, 'repo is not found');

  console.log(`cwd: ${cwd}`);
  console.log(`npmClient: ${npmClient}`);
  console.log(`isMonorepo: ${isMonorepo}`);
  console.log(`branch: ${branch}`);
  console.log(`latestTag: ${latestTag}`);
  console.log(`github repo: ${repo}`);

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

  let syncVersionsPackageJsons: string[] = [];
  if (argv.syncVersions) {
    const syncVersions = argv.syncVersions.split(',');
    syncVersionsPackageJsons = glob.globbySync(syncVersions, {
      cwd,
      absolute: true,
    });
    syncVersionsPackageJsons.forEach(p => {
      assert(p.endsWith('package.json'), `${p} specified in syncVersions must be package.json`);
      const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
      assert(pkg.version, `${p} must have a version`);
    });
  }

  let syncPublishesPaths: string[] = [];
  if (argv.syncPublishes) {
    syncPublishesPaths = argv.syncPublishes.split(',').map(p => {
      assert(fs.existsSync(p), `${p} specified in syncPublishes must exist`);
      assert(fs.statSync(p).isDirectory(), `${p} specified in syncPublishes must be a directory`);
      const pkgPath = path.join(p, 'package.json');
      assert(fs.existsSync(pkgPath), `${pkgPath} must exist`);
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      assert(pkg.name, `${pkgPath} must have a name`);
      if (pkg.name.startsWith('@')) {
        assert(pkg.publishConfig?.access, `${pkgPath} must have publishConfig.access`);
      }
      return p;
    });
  }

  if (argv.githubRelease) {
    // make sure gh is installed
    try {
      await $`gh --version`;
    } catch (e) {
      throw new Error(`gh is not installed, please install it first. It's required for github release.`);
    }
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

  console.log(`Bumping version with argv.bump: ${argv.bump} ...`);
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
      // TODO: more elegant way to sync exact version
      const version = pkg.__utool_sync_deps_exact ? newVersion : `^${newVersion}`;
      if (pkg.dependencies?.[name]) {
        pkg.dependencies[name] = version;
      } else if (pkg.devDependencies?.[name]) {
        pkg.devDependencies[name] = version;
      }
      if (!argv.dryRun) {
        fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
      }
      console.log(`Synced ${p} to ${version}`);
    });
  }

  if (argv.syncVersions) {
    console.log('Syncing versions...');
    syncVersionsPackageJsons.forEach(p => {
      const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
      pkg.version = newVersion;
      if (!argv.dryRun) {
        fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
      }
      console.log(`Synced ${p} to ${newVersion}`);
    });
  }

  if (argv.syncPublishes) {
    console.log('Syncing publishes...');
    for (const p of syncPublishesPaths) {
      if (!argv.dryRun) {
        await $`cd ${p} && npm publish --tag ${tag}`;
      }
      console.log(`Published ${p} with tag ${tag}`);
    }
  }

  if (argv.changelog) {
    console.log('Generating changelog...');
    const changelog = await generateChangelog(latestTag, newVersion, repo);
    const changelogPath = path.join(cwd, 'CHANGELOG.md');
    const originalChangelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
    const newChangelog = [changelog, originalChangelog].join('\n\n');
    fs.writeFileSync(changelogPath, newChangelog);
    console.log(`Generated changelog to ${changelogPath}`);

    const zhCNChangelogPath = path.join(cwd, 'CHANGELOG.zh-CN.md');
    // TODO: translate changelog to zh-CN
    if (fs.existsSync(zhCNChangelogPath)) {
      if (!process.env.GEMINI_API_KEY) {
        console.log('GEMINI_API_KEY is not set, skipping changelog translation');
        console.log('You can found it at https://aistudio.google.com/apikey');
        console.log('You can also set it in your environment variable');
        console.log('  export GEMINI_API_KEY=your-api-key');
        console.log(`NOTICE: YOU SHOULD MANUALLY TRANSLATE THE CHANGELOG TO ZH-CN.`);
      } else {
        const translatedChangelog = await translate(changelog);
        const originalChangelog = fs.readFileSync(zhCNChangelogPath, 'utf8');
        const newChangelog = [translatedChangelog, originalChangelog].join('\n\n');
        fs.writeFileSync(zhCNChangelogPath, newChangelog);
        console.log(`Generated zh-CN changelog to ${zhCNChangelogPath}`);
      }
    }
  }

  console.log('Adding to git...');
  await $`${npmClient} install`;
  await $`git add ./`;

  let newGitTag = newVersion;
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
      if (argv.gitTag === 'prefixed') {
        newGitTag = `${pkg.name}@${newVersion}`;
      } else if (argv.gitTag === 'v') {
        newGitTag = `v${newVersion}`;
      }
      if (!argv.dryRun) {
        console.log(`Tagging ${newGitTag}...`);
        await $`git tag ${newGitTag}`;
      }
    }
  } catch (e) {
    console.log('Nothing to commit, skipping...');
  }

  console.log("Pushing to git...");
  if (!argv.dryRun) {
    await $`git push origin ${branch} --tags`;
  }

  if (argv.githubRelease) {
    console.log(`Creating github release ${newGitTag}...`);
    if (!argv.dryRun) {
      await $`gh release create ${newGitTag} --title "${newGitTag}" --notes "## What's Changed\n\nhttps://github.com/${repo}/blob/master/CHANGELOG.md#${newVersion.replace(/\./g, '')}\n\n**Full Changelog**: https://github.com/${repo}/compare/${latestTag}...${newGitTag}"`;
    }
  }

  console.log(`Published ${pkg.name}@${newVersion}`);
}

function getPkg(cwd: string) {
  const pkgPath = path.join(cwd, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  return pkg;
}

async function getGithubRepo() {
  const repo = (await $`git config --get remote.origin.url`).stdout.trim();
  // e.g. extract umijs/tnf from git@github.com:umijs/tnf.git
  return repo.match(/:(.*)\.git/)?.[1];
}

export async function generateChangelog(latestTag: string, newVersion: string, repo: string) {
  const latestTagTime = (await $`git show -s --format=%ci ${latestTag}`).stdout.trim();
  let logs = (await $`git log --pretty=format:"- %s by @%an" --since "${latestTagTime}"`).stdout.trim().split('\n');
  logs = filterLogs(logs, repo);
  const header = `## ${newVersion}\n\n\`${new Date().toISOString().split('T')[0]}\`\n`;
  return [header, ...logs].join('\n').trim() + '\n';
}

export function filterLogs(logs: string[], repo: string) {
  logs = logs.filter(l => !l.includes('release:'));
  logs = logs.filter(l => !l.includes('chore:') && !l.includes('chore('));
  logs = logs.filter(l => !l.includes('docs:') && !l.includes('docs('));
  logs = logs.map(l => {
    // @sorrycc > [sorrycc](https://github.com/sorrycc)
    const author = l.match(/@(.*)/)?.[1];
    l = l.replace(new RegExp(`@${author}`, 'g'), `[${author}](https://github.com/${author})`);
    // (#123) > [#123](https://github.com/umijs/tnf/pull/123)
    const issues: string[] = [];
    l = l.replace(/\(#(\d+)\)/g, (m, p1) => {
      issues.push(p1);
      return '';
    });
    if (issues.length) {
      l += ` in ${issues.map(i => `[#${i}](https://github.com/${repo}/pull/${i})`).join(' ')}`;
    }
    l = l.replace(/\s+/g, ' ');
    return l;
  });
  return logs;
}

async function translate(changelog: string) {
  const result = await chat(`Translate the following text to Chinese and keep the by [author](url) and in [#number](url) in the latest if exists and keep the original format:\n\n ${changelog}`);
  return result;
}
