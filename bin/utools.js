#!/usr/bin/env node
// const path = require("path");

// // run ../src/cli.ts with tsx
// const { execSync } = require("child_process");
// const tsxPath = require.resolve("tsx/cli");
// const cliPath = path.join(__dirname, "../src/cli.ts");
// const args = process.argv.slice(2);
// execSync(`${tsxPath} ${cliPath} ${args.join(" ")}`, {
//     stdio: "inherit",
// });

require('../dist/cli');
