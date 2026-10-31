const { test } = require('node:test');
const assert = require('node:assert/strict');
const { History, write } = require('../project-store');
test('full-project undo/redo retains title, geometry and settings', () => {
  const original = JSON.stringify({ name: 'Primeiro', data: { shapes: [1], palette: ['orange'] } });
  const blank = JSON.stringify({ name: 'Novo', data: { shapes: [], palette: ['orange'] } });
  const h = new History(original); h.push(blank);
  assert.equal(h.undo(), original); assert.equal(h.redo(), blank);
});
test('editing after undo creates a new branch and drops obsolete redo', () => {
  const h = new History('a'); h.push('b'); h.push('c'); h.undo(); h.push('d');
  assert.equal(h.current, 'd'); assert.equal(h.canRedo, false); assert.equal(h.undo(), 'b');
});
test('classroom boundary removes previous project from undo history', () => {
  const h = new History('personal'); h.push('personal edited'); h.reset('student');
  assert.equal(h.canUndo, false); assert.equal(h.undo(), 'student');
});
test('unchanged state adds no duplicate steps and history stays bounded', () => {
  const h = new History('0', 3); h.push('0'); assert.equal(h.steps.length, 1);
  for (let i = 1; i < 20; i++) h.push(String(i));
  assert.equal(h.steps.length, 3); assert.equal(h.current, '19');
  const large = new History('abc', 40, 14); large.push('def'); large.push('ghi');
  assert.equal(large.steps.length, 2); assert.equal(large.current, 'ghi');
});
test('quota failure is reported without replacing stored data', () => {
  let value = 'recoverable';
  const storage = { setItem() { throw new Error('Quota exceeded'); } };
  assert.equal(write(storage, 'project', 'new'), false); assert.equal(value, 'recoverable');
});
