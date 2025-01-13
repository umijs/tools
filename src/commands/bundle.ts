import "zx/globals";
import assert from 'assert';

export async function run(argv: any) {
  console.log('Bundling...');

  const cwd = process.cwd();
  const mako = await import('@umijs/mako');
  // TODO: support multiple entry
  const entry = (() => {
    const entry = argv.entry || './src/cli.ts';
    return path.join(cwd, entry);
  })();
  const entryKey = path.basename(entry, path.extname(entry));
  const mode = argv.mode || 'production';
  const minify = argv.minify !== false;
  const outputPath = argv.outputPath || path.join(cwd, 'dist');
  assert(
    ['production', 'development'].includes(mode),
    'mode must be production or development'
  );

  await mako.build({
    config: {
      entry: {
        [entryKey]: entry,
      },
      mode,
      devtool: false,
      output: {
        path: outputPath,
        mode: 'bundle',
      },
      platform: 'node',
      optimization: {
        concatenateModules: false,
      },
      minify,
      cjs: true,
    },
    root: cwd,
    watch: false,
  });

  // patch the output file
  // replace "src" with __dirname
  if (argv.patchDirname) {
    const outputFile = path.join(outputPath, `${entryKey}.js`);
    assert(fs.existsSync(outputFile), 'Output file not found');
    const content = fs.readFileSync(outputFile, 'utf-8');
    const newContent = content.replace(/"src"/g, `__dirname`);
    // make sure the new content has two "__dirname"
    assert(newContent.includes('__dirname'), 'Output file not patched correctly');
    fs.writeFileSync(outputFile, newContent);
    console.log('Output file patched successfully');
  }

  process.exit(0);
}
