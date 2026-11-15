const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../suite-theme.js'), 'utf8');

function boot({ saved, dark = false, embedded = false, blocked = false } = {}) {
  const events = {}, attributes = {}, messages = [];
  let button;
  const media = { matches: dark, addEventListener: (_, callback) => { events.media = callback; } };
  const document = {
    documentElement: { dataset: {} },
    querySelectorAll: selector => selector === 'iframe' ? [{ contentWindow: { postMessage: message => messages.push(message) } }] : button ? [button] : [],
    querySelector: () => ({ appendChild: element => { button = element; } }),
    createElement: () => ({ dataset: {}, setAttribute: (key, value) => { attributes[key] = value; }, addEventListener: (_, callback) => { events.click = callback; } }),
    addEventListener: (name, callback) => { events[name] = callback; }
  };
  const window = { matchMedia: () => media, addEventListener: (name, callback) => { events[name] = callback; } };
  window.parent = embedded ? {} : window;
  const storage = { getItem: () => { if (blocked) throw Error(); return saved; }, setItem: (_, value) => { if (blocked) throw Error(); saved = value; } };
  vm.runInNewContext(source, { document, window, localStorage: storage, location: { origin: 'https://example.test' } });
  events.DOMContentLoaded();
  return { document, window, events, attributes, messages, media, saved: () => saved, button: () => button };
}

test('theme follows system initially, and a saved choice takes precedence', () => {
  assert.equal(boot().document.documentElement.dataset.theme, 'cmyk');
  assert.equal(boot({ dark: true }).document.documentElement.dataset.theme, 'dracula');
  assert.equal(boot({ saved: 'cmyk', dark: true }).document.documentElement.dataset.theme, 'cmyk');
});
test('switch persists preference, updates its accessible label, and synchronizes frames', () => {
  const app = boot();
  app.events.click();
  assert.equal(app.saved(), 'dracula');
  assert.equal(app.attributes['aria-pressed'], 'true');
  assert.equal(app.messages[0].theme, 'dracula');
  app.events.media();
  assert.equal(app.document.documentElement.dataset.theme, 'dracula');
});
test('embedded editors accept themes only from their same-origin parent', () => {
  const app = boot({ embedded: true });
  assert.equal(app.button(), undefined);
  const message = { type: 'explora:theme', theme: 'dracula' };
  app.events.message({ origin: 'https://other.test', source: app.window.parent, data: message });
  assert.equal(app.document.documentElement.dataset.theme, 'cmyk');
  app.events.message({ origin: 'https://example.test', source: app.window.parent, data: message });
  assert.equal(app.document.documentElement.dataset.theme, 'dracula');
});
test('switch works with unavailable storage, and other tabs synchronize', () => {
  const app = boot({ blocked: true });
  app.events.click();
  assert.equal(app.document.documentElement.dataset.theme, 'dracula');
  app.events.storage({ key: 'explora3d-theme', newValue: 'cmyk' });
  assert.equal(app.document.documentElement.dataset.theme, 'cmyk');
});
