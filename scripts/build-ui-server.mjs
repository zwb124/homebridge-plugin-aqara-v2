import { spawnSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const buildDir = path.join(root, 'homebridge-ui', '.server-build');
const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

await rm(buildDir, { recursive: true, force: true });
const result = spawnSync(process.execPath, [
  tsc,
  '--project', 'ui-src/tsconfig.json',
  '--emitDeclarationOnly', 'false',
  '--declaration', 'false',
  '--module', 'NodeNext',
  '--moduleResolution', 'NodeNext',
  '--rootDir', '.',
  '--outDir', buildDir,
], { cwd: root, stdio: 'inherit' });

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`TypeScript UI server compilation failed (exit code: ${result.status})`);
}

const compiledPath = path.join(buildDir, 'ui-src', 'server.js');
let source = await readFile(compiledPath, 'utf8');
source = source.replace(/(['"])@api\/index\1/g, "'../dist/api/index.js'");

if (!source.includes("from '@homebridge/plugin-ui-utils'")) {
  throw new Error('Compiled UI server is missing the @homebridge/plugin-ui-utils ESM import');
}
if (!source.includes("from '../dist/api/index.js'")) {
  throw new Error('Compiled UI server is missing the rewritten Aqara API import');
}
if (source.includes('require(') || !source.includes('import ')) {
  throw new Error('Compiled UI server is not valid ESM');
}

await writeFile(path.join(root, 'homebridge-ui', 'server.js'), source);
await rm(buildDir, { recursive: true, force: true });
console.log('Built homebridge-ui/server.js as ESM');
