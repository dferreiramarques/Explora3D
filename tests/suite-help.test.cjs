const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../suite-help.js'), 'utf8');

test('each app opens a five-step wizard with working back, next, finish and focus return', () => {
  for (const app of ['area', 'volume', 'revolve', 'voxel']) {
    let focused = false, dialog;
    const elements = new Map();
    const document = {
      activeElement: { focus: () => { focused = true; } },
      body: { appendChild: element => { dialog = element; } },
      createElement: () => ({
        setAttribute() {},
        querySelector: selector => {
          if (!elements.has(selector)) elements.set(selector, { focus() {} });
          return elements.get(selector);
        },
        showModal() { this.open = true; },
        close() { this.open = false; this.onclose(); }
      })
    };
    const window = {};
    vm.runInNewContext(source, { window, document });
    window.ExploraHelp.open(app, app);
    assert.equal(dialog.open, true);
    assert.equal(elements.get('progress').value, 1);
    assert.equal(elements.get('[data-help="back"]').disabled, true);
    elements.get('[data-help="next"]').onclick();
    assert.equal(elements.get('progress').value, 2);
    elements.get('[data-help="back"]').onclick();
    assert.equal(elements.get('progress').value, 1);
    for (let step = 0; step < 4; step++) elements.get('[data-help="next"]').onclick();
    assert.equal(elements.get('progress').value, 5);
    assert.equal(elements.get('[data-help="next"]').textContent, 'Começar a criar');
    elements.get('[data-help="next"]').onclick();
    assert.equal(dialog.open, false);
    assert.equal(focused, true);
    window.ExploraHelp.open(app, app);
    assert.equal(elements.get('progress').value, 1);
    elements.get('[data-help="close"]').onclick();
    assert.equal(dialog.open, false);
  }
});

test('printing action invokes the editor STL exporter without opening an intermediate dialog', async () => {
  const workspace = fs.readFileSync(path.join(__dirname, '../workspace.js'), 'utf8');
  const handler = workspace.slice(workspace.indexOf("  button('output').onclick ="), workspace.indexOf("  button('help').onclick"));
  for (const app of ['area', 'volume', 'revolve']) {
    const output = {}, calls = [];
    vm.runInNewContext(handler, {
      app, button: () => output,
      exportSTL: () => calls.push('area'), downloadSTL: () => calls.push('volume'), exportarSTL: () => calls.push('revolve'),
      showDialog: () => assert.fail('Unexpected dialog'), setStatus: message => assert.fail(message)
    });
    await output.onclick();
    assert.deepEqual(calls, [app]);
  }
});
