import { readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';

const sourcePath = 'ui-src/server.ts';
const outputPath = 'homebridge-ui/server.js';
const source = await readFile(sourcePath, 'utf8');

const result = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
    importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
  },
  fileName: sourcePath,
  reportDiagnostics: true,
});

const errors = (result.diagnostics ?? []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);
if (errors.length) {
  throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCurrentDirectory: () => process.cwd(),
    getCanonicalFileName: (fileName) => fileName,
    getNewLine: () => '\n',
  }));
}

const output = result.outputText.replace(
  /(['"])@api\/index\1/g,
  "'../dist/api/index.js'",
);

if (!/from\s+['"]@homebridge\/plugin-ui-utils['"]/.test(output)) {
  throw new Error('Generated UI server is missing the Homebridge UI utils ESM import');
}
if (!/from\s+['"]\.\.\/dist\/api\/index\.js['"]/.test(output)) {
  throw new Error('Generated UI server is missing the built Aqara API ESM import');
}
if (/\brequire\s*\(/.test(output) || !/^import\s/m.test(output)) {
  throw new Error('Generated UI server is not valid ESM');
}

await writeFile(outputPath, output);
console.log('Built homebridge-ui/server.js as ESM');
