import { test } from "vitest";
import { chat } from "./chat";

test.skip('chat', async () => {
  const result = await chat('Hello, world!');
  console.log(result);
});

test.skip('translate', async () => {
  const changelog = [
    '## 0.1.17',
    '',
    '`2025-01-16`',
    '',
    '- docs(changelog): correct versioning and update changelog entries for 0.1.14 and 0.1.16 by [sorrycc](https://github.com/sorrycc)',
    '- fix(release): correct changelog order and format header timestamp by [sorrycc](https://github.com/sorrycc) in [#123](https://github.com/sorrycc/utools/pull/123)',
  ].join('\n');
  const result = await chat(`Translate the following text to Chinese and keep the {by [author](url) and in [pr](url)} in the latest and keep the original format:\n\n ${changelog}`);
  console.log(result);
});