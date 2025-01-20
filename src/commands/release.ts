import "zx/globals";
import getGitRepoInfo from 'git-repo-info';
import assert from 'assert';
import { chat } from "../libs/chat.js";
import * as p from '@umijs/clack-prompts';
import pc from 'picocolors';
import { execa } from '../libs/execa.js';

const CANCEL_TEXT = 'Operation cancelled.'

interface ReleaseOptions {
  npmClient?: "pnpm" | "npm" | "yarn" | "bun";
  publishNpmClient?: "npm" | "pnpm" | "tnpm";
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
  checkOwnership?: boolean;
}

export async function run(argv: ReleaseOptions) {
  p.intro('Release');
    try {
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
    const publishNpmClient = argv.publishNpmClient || "npm";

    const infos = [
      `cwd: ${cwd}`,
      `npmClient: ${npmClient}`,
      `isMonorepo: ${isMonorepo}`,
      `branch: ${branch}`,
      `latestTag: ${latestTag}`,
      `github repo: ${repo}`,
      `publishNpmClient: ${publishNpmClient}`,
    ];
    p.box(infos.join('\n'), 'Release Info');

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
      const s = p.spinner();
      s.start('Checking if git status is clean...');
      const isGitClean = (await $`git status --porcelain`).stdout.trim().length === 0;
      if (!isGitClean) {
        s.stop('Git status is not clean');
        throw new Error('git status is not clean');
      }
      s.stop('Git status is clean');
    }

    if (argv.checkOwnership !== false) {
      const s = p.spinner();
      s.start('Checking ownership...');
      const isOwner = await checkOwnership(pkg.name, publishNpmClient);
      if (!isOwner) {
        s.stop('You are not the owner of the package');
        throw new Error('You are not the owner of the package');
      }
      s.stop('Checked ownership');
    }

    // check package access
    p.log.step('Checking package access...');
    const pkgAccess = pkg.publishConfig?.access;
    const isScoped = pkg.name.startsWith('@');
    if (isScoped && publishNpmClient === 'npm') {
      assert(pkgAccess === 'public', 'package access is not public');
    }

    if (argv.build !== false && pkg.scripts?.build) {
      const t = p.taskLog('Building...');
      t.text = 'Building...';
      await execa('npm', ['run', 'build'], {
        cwd,
        onData: (data) => {
          t.text = data;
        },
      });
      t.success('Build finished');
      if (pkg.scripts?.doctor) {
        const t = p.taskLog('Doctoring...');
        t.text = 'Doctoring...';
        await execa('npm', ['run', 'doctor'], {
          cwd,
          onData: (data) => {
            t.text = data;
          },
        });
        t.success('Doctor finished');
      }
    } else {
      const cue = argv.build === false
        ? "--no-build arg is specified"
        : "no build script found";
      p.log.info(`Skipping build since ${cue}`);
    }

    p.log.info(`Bumping version with argv.bump: ${argv.bump} ...`);
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
      const s = p.spinner();
      s.start(`Bumping version to ${bump}...`);
      if (!argv.dryRun) {
        await $`npm version ${bump} --no-commit-hooks --no-git-tag-version`;
      }
      s.stop(`Bumped version to ${bump}`);
    }
    if (bump === "question") {
      const newVersion = await p.text({
        message: 'Enter the new version: ',
      });
      assert(!p.isCancel(newVersion), CANCEL_TEXT);
      p.log.step(`Bumping version to ${newVersion}...`);
      const pkgPath = path.join(cwd, "package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkg.version = newVersion;
      if (!argv.dryRun) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }
    }

    const newVersion = getPkg(cwd).version;
    p.log.info(`New version: ${newVersion}`);

    const t = p.taskLog('Publishing...');
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
    t.text = `Publishing with tag: ${tag}`;
    if (!argv.dryRun) {
      await execa('npm', ['publish', '--tag', tag], {
        cwd,
        onData: (data) => {
          t.text = data;
        },
      });
    }
    t.success(`Published with tag: ${tag}`);

    if (argv.syncDeps) {
      const s = p.spinner();
      s.start('Syncing dependencies...');
      syncDepsPackageJsons.forEach(packageJson => {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        // TODO: more elegant way to sync exact version
        const version = pkg.__utool_sync_deps_exact ? newVersion : `^${newVersion}`;
        if (pkg.dependencies?.[name]) {
          pkg.dependencies[name] = version;
        } else if (pkg.devDependencies?.[name]) {
          pkg.devDependencies[name] = version;
        }
        if (!argv.dryRun) {
          fs.writeFileSync(packageJson, JSON.stringify(pkg, null, 2) + '\n');
        }
        s.message(`Synced ${packageJson} to ${version}`);
      });
      s.stop('Synced dependencies');
    }

    if (argv.syncVersions) {
      const s = p.spinner();
      s.start('Syncing versions...');
      syncVersionsPackageJsons.forEach(p => {
        const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
        pkg.version = newVersion;
        if (!argv.dryRun) {
          fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
        }
        s.message(`Synced ${p} to ${newVersion}`);
      });
      s.stop('Synced versions');
    }

    if (argv.syncPublishes) {
      const s = p.spinner();
      s.start('Syncing publishes...');
      for (const p of syncPublishesPaths) {
        if (!argv.dryRun) {
          await $`cd ${p} && ${publishNpmClient} publish --tag ${tag}`;
        }
        s.message(`Published ${p} with tag ${tag}`);
      }
      s.stop('Synced publishes');
    }

    if (argv.changelog) {
      const s = p.spinner();
      s.start('Generating changelog...');
      const changelog = await generateChangelog(latestTag, newVersion, repo);
      const changelogPath = path.join(cwd, 'CHANGELOG.md');
      const originalChangelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
      const newChangelog = [changelog, originalChangelog].join('\n\n');
      fs.writeFileSync(changelogPath, newChangelog);
      s.stop(`Generated changelog to ${changelogPath}`);

      const zhCNChangelogPath = path.join(cwd, 'CHANGELOG.zh-CN.md');
      // TODO: translate changelog to zh-CN
      if (fs.existsSync(zhCNChangelogPath)) {
        if (!process.env.GEMINI_API_KEY) {
          const messages = [
            'GEMINI_API_KEY is not set, skipping changelog translation',
            'You can found it at https://aistudio.google.com/apikey',
            'You can also set it in your environment variable',
            '  export GEMINI_API_KEY=your-api-key',
            `NOTICE: YOU SHOULD MANUALLY TRANSLATE THE CHANGELOG TO ZH-CN.`,
          ];
          p.box(messages.join('\n'), pc.yellow('NOTICE'));
        } else {
          const translatedChangelog = await translate(changelog);
          const originalChangelog = fs.readFileSync(zhCNChangelogPath, 'utf8');
          const newChangelog = [translatedChangelog, originalChangelog].join('\n\n');
          fs.writeFileSync(zhCNChangelogPath, newChangelog);
          p.log.step(`Generated zh-CN changelog to ${zhCNChangelogPath}`);
        }
      }
    }

    await (async () => {
      const s = p.spinner();
      s.start('Adding to git...');
      await $`${npmClient} install`;
      await $`git add ./`;
      s.stop('Added to git');
    })();

    let newGitTag = newVersion;
    try {
      const s = p.spinner();
      s.start('Committing to git...');
      if (isMonorepo) {
        if (!argv.dryRun) {
          await $`git commit -m "release: ${pkg.name}@${newVersion}" -n`;
        }
      } else {
        if (!argv.dryRun) {
          await $`git commit -m "release: ${newVersion}" -n`;
        }
      }
      s.stop('Committed to git');
      if (argv.gitTag) {
        const s = p.spinner();
        s.start('Tagging...');
        if (argv.gitTag === 'prefixed') {
          newGitTag = `${pkg.name}@${newVersion}`;
        } else if (argv.gitTag === 'v') {
          newGitTag = `v${newVersion}`;
        }
        if (!argv.dryRun) {
          s.message(`Tagging ${newGitTag}...`);
          await $`git tag ${newGitTag}`;
        }
        s.stop(`Tagged ${newGitTag}`);
      }
    } catch (e) {
      p.log.info('Nothing to commit, skipping...');
    }

    await (async () => {
      const t = p.taskLog('Pushing to git...');
      if (!argv.dryRun) {
        await execa('git', ['push', 'origin', branch, '--tags'], {
          cwd,
          onData: (data) => {
            t.text = data;
          },
        });
      }
      t.success('Pushed to git');
    })();

    if (argv.githubRelease) {
      const t = p.taskLog(`Creating github release ${newGitTag}...`);
      if (!argv.dryRun) {
        await execa('gh', ['release', 'create', newGitTag, '--title', newGitTag, '--notes', `## What's Changed\n\nhttps://github.com/${repo}/blob/master/CHANGELOG.md#${newVersion.replace(/\./g, '')}\n\n**Full Changelog**: https://github.com/${repo}/compare/${latestTag}...${newGitTag}`], {
          cwd,
          onData: (data) => {
            t.text = data;
          },
        });
      }
      t.success(`Created github release ${newGitTag}`);
    }

    p.outro(`Published ${pkg.name}@${newVersion}`);
  } catch (e) {
    p.cancel(`Release failed: ${e}`);
  }
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
  logs = logs.filter(l => !l.startsWith('- release:'));
  logs = logs.filter(l => !l.startsWith('- chore:') && !l.startsWith('- chore('));
  logs = logs.filter(l => !l.startsWith('- docs:') && !l.startsWith('- docs('));
  logs = logs.filter(l => !l.startsWith('- ci:') && !l.startsWith('- ci('));
  logs = logs.filter(l => !l.startsWith('- test:') && !l.startsWith('- test('));
  logs = logs.map(l => {
    // @sorrycc > [sorrycc](https://github.com/sorrycc)
    const author = l.match(/by @(.*)/)?.[1];
    l = l.replace(new RegExp(`@${author}`, 'g'), `[@${author}](https://github.com/${author})`);
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

async function checkOwnership(pkgName: string, publishNpmClient: string) {
  const pkgs = [pkgName];
  const isOwners = await Promise.all(pkgs.map(async pkg => {
    const whoami = (await $`${publishNpmClient} whoami`).stdout.trim();
    const owners = (await $`${publishNpmClient} owner ls ${pkg}`).stdout.trim().split('\n');
    const isOwner = owners.includes(whoami);
    if (!isOwner) {
      console.log('owner check failed since:');
      console.log('whoami', whoami);
      console.log('owners', owners);
      console.log('pkg', pkg);
      console.log('publishNpmClient', publishNpmClient);
      console.log('isOwner', isOwner);
    }
    return isOwner;
  }));
  return isOwners.every(isOwner => isOwner);
}
