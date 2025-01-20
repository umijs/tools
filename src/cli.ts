import path from "path";
import yParser from "yargs-parser";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const argv = yParser(process.argv.slice(2));
const command = argv._[0];

const commandPath = path.join(__dirname, "commands", `${command}.js`);
if (fs.existsSync(commandPath)) {
  import(commandPath).then((module) => {
    module.run(argv).catch((e: any) => {
      console.error(e);
      process.exit(1);
    });
  }).catch((e: any) => {
    console.error(e);
    process.exit(1);
  });
} else {
  console.error(`Command ${command} not found`);
  process.exit(1);
}
