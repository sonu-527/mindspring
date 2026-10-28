import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/index.js');

test('Smoke test - Server exports valid Express application', () => {
  assert.ok(app);
  assert.equal(typeof app.listen, 'function');
});
