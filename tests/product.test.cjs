const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'product.js'), 'utf8');

test('old bookmarks and classroom invitations enter /app with query and section intact', () => {
  for (const suffix of ['#area', '#volume', '#revolve', '#voxel', '#home', '?code=ABC123', '?code=ABC123#area']) {
    let destination;
    const location = new URL('https://example.test/project/' + suffix);
    location.replace = value => { destination = new URL(value); };
    vm.runInNewContext(source, { location, URL, URLSearchParams });
    assert.equal(destination.pathname, '/project/app/');
    assert.equal(destination.search, location.search);
    assert.equal(destination.hash, location.hash || '#volume');
  }
});
test('product page section anchors stay on the product page', () => {
  for (const suffix of ['', '#ferramentas', '#aprender', '#sala']) {
    const location = new URL('https://example.test/' + suffix);
    location.replace = () => assert.fail('Unexpected redirect');
    vm.runInNewContext(source, { location, URL, URLSearchParams });
  }
});
test('application assets, navigation and editors resolve from /app and a project subpath', () => {
  const html = fs.readFileSync(path.join(root, 'app/index.html'), 'utf8');
  for (const prefix of ['/', '/project/']) {
    const base = new URL(html.match(/<base href="([^"]+)"/)[1], 'https://example.test' + prefix + 'app/');
    for (const asset of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|svg))"/g)) {
      const url = new URL(asset[1], base);
      assert(fs.existsSync(path.join(root, url.pathname.slice(prefix.length))), url.href);
    }
    for (const app of ['area', 'volume', 'revolve', 'voxel']) {
      assert(html.includes('href="app/#' + app + '"'));
      assert.equal(new URL('app/#' + app, base).pathname, prefix + 'app/');
    }
    assert.equal(new URL('./apps/volume/', base).pathname, prefix + 'apps/volume/');
  }
});
