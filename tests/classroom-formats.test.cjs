const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validProject } = require('../server/src/projectFormats');
const projects = {
  area: { canvas: 'data:image/png;base64,iVBORw0KGgo=', settings: { resolution: 600 } },
  revolve: { pontos: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }], segmentos: 20 },
  voxel: { blocos: [{ x: 0, y: 0, z: 0, c: 3 }] }
};
test('native formats are accepted only for their own editor', () => {
  for (const [app, data] of Object.entries(projects)) {
    assert.equal(validProject(app, { app, version: 1, data }), true);
    for (const other of Object.keys(projects).filter(other => other !== app)) assert.equal(validProject(other, { app, version: 1, data }), false);
  }
});
test('malformed coordinates and unbounded payloads cannot be saved as projects', () => {
  assert.equal(validProject('voxel', { app: 'voxel', version: 1, data: { blocos: [{ x: 16, y: 0, z: 0, c: 0 }] } }), false);
  assert.equal(validProject('revolve', { app: 'revolve', version: 1, data: { pontos: [{ x: NaN, y: 0 }], segmentos: 20 } }), false);
  assert.equal(validProject('area', { app: 'area', version: 1, data: { canvas: 'javascript:bad', settings: { resolution: 600 } } }), false);
  assert.equal(validProject('area', { app: 'area', version: 1, data: { ...projects.area, name: 'x'.repeat(7 * 1024 * 1024) } }), false);
});
