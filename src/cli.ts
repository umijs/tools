import yParser from "yargs-parser";
import { run as runBundle } from "./commands/bundle";
import { run as runRelease } from "./commands/release";

const argv = yParser(process.argv.slice(2));
const command = argv._[0];

async function main() {
  switch (command) {
    case 'bundle':
      await runBundle(argv as any);
      break;
    case 'release':
      await runRelease(argv as any);
      break;
    default:
      console.error(`Command ${command} not found`);
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
