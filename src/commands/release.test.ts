import { test, expect } from 'vitest';
import { filterLogs } from './release';

test('filterLogs', () => {
  // Test filtering release commits
  const logsWithRelease = [
    '- feat: add new feature by @user1',
    '- release: 1.0.0',
    '- fix: bug fix by @user2',
  ];
  expect(filterLogs(logsWithRelease, 'owner/repo')).toEqual([
    '- feat: add new feature by [@user1](https://github.com/user1)',
    '- fix: bug fix by [@user2](https://github.com/user2)',
  ]);

  // Test converting GitHub usernames to links
  const logsWithUsers = [
    '- feat: implement something by @johndoe',
    '- fix: resolve issue by @janedoe',
  ];
  expect(filterLogs(logsWithUsers, 'owner/repo')).toEqual([
    '- feat: implement something by [@johndoe](https://github.com/johndoe)',
    '- fix: resolve issue by [@janedoe](https://github.com/janedoe)',
  ]);

  // Test converting issue/PR references to links
  const logsWithIssues = [
    '- feat: new feature (#123) @umijs/tnf by @user1',
    '- fix: multiple issues (#456) (#789) by @user2',
  ];
  expect(filterLogs(logsWithIssues, 'owner/repo')).toEqual([
    '- feat: new feature @umijs/tnf by [@user1](https://github.com/user1) in [#123](https://github.com/owner/repo/pull/123)',
    '- fix: multiple issues by [@user2](https://github.com/user2) in [#456](https://github.com/owner/repo/pull/456) [#789](https://github.com/owner/repo/pull/789)',
  ]);

  // Test empty logs
  expect(filterLogs([], 'owner/repo')).toEqual([]);

  // Test logs without users or issues
  const plainLogs = [
    '- feat: add something',
    '- fix: fix something',
  ];
  expect(filterLogs(plainLogs, 'owner/repo')).toEqual([
    '- feat: add something',
    '- fix: fix something',
  ]);
});

