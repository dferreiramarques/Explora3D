const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function boot(suffix = '') {
  class Element {
    constructor() {
      this.hidden = false; this.dataset = {}; this.children = []; this.attrs = {};
      this.listeners = {}; this.firstChild = { textContent: '' };
      this.messages = [];
      this.contentWindow = { postMessage: data => this.messages.push(data) };
      this.classList = { toggle: (name, value) => { this[name] = value; } };
    }
    setAttribute(name, value) { this.attrs[name] = value; }
    removeAttribute(name) { delete this.attrs[name]; }
    toggleAttribute(name, value) { value ? this.attrs[name] = '' : delete this.attrs[name]; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    appendChild(child) { this.children.push(child); }
    remove() { this.removed = true; }
  }
  const ids = Object.fromEntries(['suite-home', 'suite-workspace', 'suite-frames', 'suite-load-status', 'suite-load-help', 'suite-direct', 'suite-retry'].map(id => [id, new Element()]));
  const links = ['area', 'volume', 'revolve', 'voxel'].map(id => Object.assign(new Element(), { dataset: { app: id } }));
  const homeLink = new Element();
  let location = new URL('http://localhost:8766/monco3d/' + suffix);
  const events = {};
  const timers = new Map();
  let timerId = 0;
  const document = {
    getElementById: id => ids[id],
    querySelectorAll: () => links,
    querySelector: selector => selector === '.suite-home' ? homeLink : new Element(),
    createElement: () => new Element()
  };
  const window = { addEventListener: (name, fn) => { events[name] = fn; } };
  const context = vm.createContext({
    window, document, URL, URLSearchParams, location,
    history: { replaceState: (_, __, url) => { location.href = new URL(url, location).href; } },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id)
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../suite.config.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../suite-shell.js'), 'utf8'), context);
  return { ids, links, timers, location, go(hash) { location.hash = hash; events.hashchange(); } };
}

test('starts at quadrants without loading any editor', () => {
  const app = boot();
  assert.equal(app.ids['suite-home'].hidden, false);
  assert.equal(app.ids['suite-frames'].children.length, 0);
});
test('switching sections and home preserves the same editor and project', () => {
  const app = boot();
  app.go('#voxel');
  const voxel = app.ids['suite-frames'].children[0];
  voxel.project = { blocks: [1, 2, 3] };
  app.go('#area'); app.go('#home'); app.go('#voxel');
  assert.equal(app.ids['suite-frames'].children.length, 2);
  assert.equal(app.ids['suite-frames'].children[0], voxel);
  assert.equal(voxel.project.blocks.length, 3);
  assert.equal(voxel.inert, false);
  assert.equal(app.ids['suite-frames'].children[1].inert, true);
  assert.equal(app.links[3].attrs['aria-current'], 'page');
});
test('existing classroom links open Volume and preserve the code', () => {
  const app = boot('?code=AB12CD');
  assert.equal(app.location.hash, '#volume');
  assert.equal(app.ids['suite-frames'].children[0].src, 'http://localhost:8766/monco3d/apps/volume/?code=AB12CD');
});
test('invalid routes return home without creating a frame', () => {
  const app = boot('#unknown');
  assert.equal(app.location.hash, '#home');
  assert.equal(app.ids['suite-frames'].children.length, 0);
});
test('load help is cleared when a delayed editor becomes ready', () => {
  const app = boot('#area');
  [...app.timers.values()].forEach(fn => fn());
  assert.equal(app.ids['suite-load-help'].hidden, false);
  app.ids['suite-frames'].children[0].listeners.load();
  assert.equal(app.ids['suite-load-help'].hidden, true);
  assert.equal(app.ids['suite-load-status'].textContent, '');
});
test('retry cannot remove a loaded editor', () => {
  const app = boot('#revolve');
  const frame = app.ids['suite-frames'].children[0];
  frame.listeners.load();
  app.ids['suite-retry'].listeners.click();
  assert.equal(frame.removed, undefined);
});

test('hidden editors receive a pause message and resume when reopened', () => {
  const app = boot('#revolve');
  const frame = app.ids['suite-frames'].children[0];
  frame.listeners.load();
  assert.equal(frame.messages.at(-1).active, true);
  app.go('#voxel');
  assert.equal(frame.messages.at(-1).active, false);
  app.go('#revolve');
  assert.equal(frame.messages.at(-1).active, true);
});

test('classroom links for every new section preserve the route and do not leak the code to other editors', () => {
  for (const id of ['area', 'revolve', 'voxel']) {
    const app = boot('?code=ABC123#' + id);
    assert.equal(app.location.hash, '#' + id);
    assert.equal(new URL(app.ids['suite-frames'].children[0].src).searchParams.get('code'), 'ABC123');
    app.go('#volume');
    assert.equal(new URL(app.ids['suite-frames'].children[1].src).search, '');
  }
});
