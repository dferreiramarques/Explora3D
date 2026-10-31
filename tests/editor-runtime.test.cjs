const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('only the same-origin parent can pause or resume an editor', () => {
  const parent = {};
  let onMessage;
  const window = { parent, frameElement: { classList: { contains: () => false } }, addEventListener: (_, fn) => { onMessage = fn; } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'editor-runtime.js'), 'utf8'), {
    window, location: { origin: 'http://localhost' }, document: { body: { dataset: { suiteApp: 'area' } } }
  });
  assert.equal(window.exploraFrameActive, false);
  onMessage({ source: parent, origin: 'https://other.example', data: { type: 'explora:visibility', active: true } });
  assert.equal(window.exploraFrameActive, false);
  onMessage({ source: parent, origin: 'http://localhost', data: { type: 'explora:visibility', active: true } });
  assert.equal(window.exploraFrameActive, true);
});

test('Voxel and Revolve skip GPU rendering while inactive, then resume', () => {
  for (const file of ['apps/voxel/app.js', 'apps/revolve/public/app.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const animate = source.slice(source.lastIndexOf('function animate() {'), source.indexOf("window.addEventListener('load', init)", source.lastIndexOf('function animate() {')));
    let renders = 0;
    const context = vm.createContext({ window: { exploraFrameActive: false }, document: { hidden: false }, requestAnimationFrame() {}, animando: false, scene: {}, camera: {}, renderer: { render() { renders++; } } });
    vm.runInContext(animate + '\nanimate();', context);
    assert.equal(renders, 0, file);
    vm.runInContext('window.exploraFrameActive = true; animate();', context);
    assert.equal(renders, 1, file);
  }
});

test('dragging a profile batches geometry updates and uses the latest position', () => {
  const editor = { value: '' };
  const callbacks = [];
  let renders = 0;
  const context = vm.createContext({
    console, window: { addEventListener() {} }, THREE: { Vector3: class {} },
    document: { getElementById: () => editor },
    requestAnimationFrame: fn => { callbacks.push(fn); return callbacks.length; },
    render: () => renders++
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'apps/revolve/public/app.js'), 'utf8'), context);
  vm.runInContext('carregarJSON = render; perfilGesto = {id:1}; aplicarPerfil({pontos:[{x:1,y:2}]}); aplicarPerfil({pontos:[{x:3,y:4}]});', context);
  assert.equal(callbacks.length, 1);
  assert.equal(renders, 0);
  callbacks[0]();
  assert.equal(renders, 1);
  assert.equal(JSON.parse(editor.value).pontos[0].x, 3);
});
