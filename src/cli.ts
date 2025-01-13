import path from "path";
import yParser from "yargs-parser";
import fs from "fs";

const argv = yParser(process.argv.slice(2));

const command = argv._[0];

const commandPath = path.join(__dirname, "commands", `${command}.ts`);
if (fs.existsSync(commandPath)) {
  require(commandPath).run(argv).catch((e: any) => {
    console.error(e);
    process.exit(1);
  });
} else {
  console.error(`Command ${command} not found`);
  process.exit(1);
}
