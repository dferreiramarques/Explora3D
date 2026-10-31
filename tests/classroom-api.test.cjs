const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createMemoryAPI } = require('./support/classroom-memory.cjs');

test('classroom routes isolate apps, preserve deliveries and remain compatible with Volume', async t => {
  const { app, teacher } = createMemoryAPI();
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = 'http://127.0.0.1:' + server.address().port;
  const request = async (path, method = 'GET', body, token) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, data: await res.json() };
  };
  const login = await request('/api/auth/login', 'POST', { email: teacher.email, password: 'teste123' });
  assert.equal(login.status, 200);
  const token = login.data.token;
  await t.test('registration, duplicate email and subsequent login', async () => {
    assert.equal((await request('/api/auth/register', 'POST', { email: 'invalid', password: 'teste123' })).status, 400);
    assert.equal((await request('/api/auth/register', 'POST', { email: 'novo@example.test', password: '123' })).status, 400);
    const registered = await request('/api/auth/register', 'POST', { email: 'Novo@Example.Test', password: 'teste456' });
    assert.equal(registered.status, 200); assert(registered.data.token);
    assert.equal((await request('/api/auth/register', 'POST', { email: 'novo@example.test', password: 'teste456' })).status, 409);
    const newLogin = await request('/api/auth/login', 'POST', { email: 'novo@example.test', password: 'teste456' });
    assert.equal(newLogin.status, 200); assert(newLogin.data.token);
    assert.equal((await request('/api/auth/login', 'POST', { email: 'novo@example.test', password: 'errada' })).status, 401);
    const own = await request('/api/activities?app_id=revolve', 'GET', null, newLogin.data.token);
    assert.equal(own.status, 200); assert.equal(own.data.length, 0);
  });
  const projects = {
    area: { canvas: 'data:image/png;base64,iVBORw0KGgo=', settings: { resolution: 600 } },
    revolve: { pontos: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }], segmentos: 20 },
    voxel: { blocos: [{ x: 0, y: 0, z: 0, c: 3 }] }
  };
  for (const [appId, data] of Object.entries(projects)) await t.test(appId, async () => {
    const created = await request('/api/activities', 'POST', { title: 'Desafio ' + appId, brief: 'Explora uma forma', app_id: appId }, token);
    assert.equal(created.status, 200); assert.equal(created.data.app_id, appId);
    const code = created.data.classroom_code;
    const wrong = await request('/api/submissions/join', 'POST', { classroom_code: code, student_name: 'Aluno teste', student_pin: '1234', app_id: 'volume' });
    assert.equal(wrong.status, 409);
    const creds = { classroom_code: code, student_name: 'Aluno teste', student_pin: '1234', app_id: appId };
    const joined = await request('/api/submissions/join', 'POST', creds);
    assert.equal(joined.status, 200); assert.equal(joined.data.project_json, null);
    const id = joined.data.submission_id;
    const project = { version: 1, app: appId, data };
    assert.equal((await request('/api/submissions/' + id, 'PUT', { project_json: project, submit: true })).status, 200);
    const draft = structuredClone(project); draft.data.name = 'Novo rascunho';
    assert.equal((await request('/api/submissions/' + id, 'PUT', { project_json: draft })).status, 200);
    const result = await request('/api/teacher/submissions/' + id, 'GET', null, token);
    assert.deepEqual(result.data.submitted_project_json, project);
    assert.deepEqual(result.data.project_json, draft);
    const resumed = await request('/api/submissions/join', 'POST', creds);
    assert.equal(resumed.data.submission_id, id); assert.deepEqual(resumed.data.project_json, draft);
    const list = await request('/api/activities?app_id=' + appId, 'GET', null, token);
    assert.equal(list.data.length, 1); assert.equal(list.data[0].app_id, appId);
    const results = await request('/api/activities/' + created.data.id + '/submissions', 'GET', null, token);
    assert(results.data[0].submitted_at);
    assert.equal((await request('/api/teacher/submissions/' + id)).status, 401);
    const jwt = require('../server/node_modules/jsonwebtoken');
    const other = jwt.sign({ teacherId: 'another-teacher' }, process.env.JWT_SECRET);
    assert.equal((await request('/api/teacher/submissions/' + id, 'GET', null, other)).status, 404);
    assert.equal((await request('/api/submissions/' + id, 'PUT', { project_json: { version: 1, app: 'other', data } })).status, 400);
  });
  const old = await request('/api/activities', 'POST', { title: 'Volume antigo' }, token);
  assert.equal(old.data.app_id, 'volume');
  const join = await request('/api/submissions/join', 'POST', { classroom_code: old.data.classroom_code, student_name: 'Aluno Volume', student_pin: '4321' });
  assert(Array.isArray(join.data.shapes_json.shapes));
  assert.equal((await request('/api/submissions/' + join.data.submission_id, 'PUT', { shapes_json: { shapes: [] } })).status, 200);
  const oldList = await request('/api/activities', 'GET', null, token);
  assert.equal(oldList.data.length, 1); assert.equal(oldList.data[0].app_id, 'volume');
});
