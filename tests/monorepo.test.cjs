const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'suite.config.js'), 'utf8'), context);
const apps = context.window.SUITE_APPS;

test('all four editors are served from this checkout, without sibling repositories', () => {
  assert.deepEqual(Object.keys(apps), ['area', 'volume', 'revolve', 'voxel']);
  for (const app of Object.values(apps)) {
    const folder = path.resolve(root, app.url);
    assert(folder.startsWith(root + path.sep));
    assert(fs.existsSync(path.join(folder, 'index.html')), app.name);
  }
});
test('every active editor uses the same root theme and resolves its local assets', () => {
  for (const app of Object.values(apps)) {
    const folder = path.resolve(root, app.url);
    const html = fs.readFileSync(path.join(folder, 'index.html'), 'utf8');
    const css = html.match(/href="([^"\n]*suite-ui\.css)"/);
    assert(css, app.name);
    assert.equal(path.resolve(folder, css[1]), path.join(root, 'suite-ui.css'));
    for (const match of html.matchAll(/(?:src|href)="([^"#?]+\.(?:js|css|ico|png|svg|json))"/g)) {
      if (/^(https?:|data:)/.test(match[1])) continue;
      assert(fs.existsSync(path.resolve(folder, match[1])), `${app.name}: ${match[1]}`);
    }
    for (const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
      new vm.Script(script[1], { filename: app.name });
    }
  }
});
test('source licences and pedagogical materials were imported', () => {
  for (const app of ['area', 'revolve', 'voxel']) assert(fs.existsSync(path.join(root, 'apps', app, 'LICENSE')));
  for (const file of ['apps/voxel/GUIAO_DINAMIZADOR.md', 'apps/revolve/materiais-pedagogicos/README.md', 'apps/area/stampforge-docs/TECHNICAL.md']) {
    assert(fs.existsSync(path.join(root, file)), file);
  }
});

test('all editors use one project bar, panel stylesheet and classroom client', () => {
  for (const app of Object.values(apps)) {
    const html = fs.readFileSync(path.resolve(root, app.url, 'index.html'), 'utf8');
    for (const asset of ['workspace.js', 'workspace.css', 'project-store.js', 'classroom.js', 'classroom-adapter.js']) {
      assert(html.includes(asset), app.name + ': ' + asset);
    }
    assert(html.indexOf('workspace.js') < html.lastIndexOf('classroom.js'), app.name);
  }
});
test('Volume legacy link preserves activity query and redirects into the suite', () => {
  const script = fs.readFileSync(path.join(root, 'volume.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  let destination;
  vm.runInNewContext(script, {
    URL,
    document: { getElementById: () => ({}) },
    location: { href: 'https://example.test/volume.html?code=ABC123', search: '?code=ABC123', replace: url => { destination = url; } }
  });
  assert.equal(destination, 'https://example.test/?code=ABC123#volume');
});
