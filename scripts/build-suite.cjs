const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, 'dist');
// Rebuild only the generated folder inside this checkout; reject symlinks.
if (path.dirname(output) !== root || path.basename(output) !== 'dist' ||
    (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink())) {
  throw new Error('Invalid distribution directory');
}
const files = ['index.html', 'volume.html', 'mosaico.html', 'stencil.html',
  'suite-ui.css', 'suite-shell.css', 'suite-shell.js', 'suite.config.js', 'editor-runtime.js',
  'classroom.css', 'classroom.config.js', 'classroom-adapter.js', 'classroom.js', 'CNAME', 'LICENSE'];
files.push('workspace.css', 'workspace.js', 'project-store.js');
for (const file of files) {
  if (!fs.statSync(path.join(root, file)).isFile()) throw new Error(`Missing ${file}`);
}
for (const app of ['area/index.html', 'volume/index.html', 'revolve/public/index.html', 'voxel/index.html']) {
  if (!fs.statSync(path.join(root, 'apps', app)).isFile()) throw new Error(`Missing editor ${app}`);
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));
fs.cpSync(path.join(root, 'apps'), path.join(output, 'apps'), {
  recursive: true,
  filter: source => !['.git', 'node_modules', 'server.js', 'serve.py', 'package.json', 'railway.toml', 'nixpacks.toml'].includes(path.basename(source)) && !path.basename(source).startsWith('.env')
});
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
console.log(`Explora3D assembled at ${output}`);
