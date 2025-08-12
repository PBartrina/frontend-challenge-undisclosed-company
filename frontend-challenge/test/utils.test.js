import assert from 'node:assert/strict';
import test from 'node:test';
import { compareSemver, formatVersion, formatRelativeDate, uuid } from '../app/utils.js';

test('compareSemver orders correctly', () => {
  assert.equal(compareSemver('1.0.0', '1.0.0'), 0);
  assert.equal(Math.sign(compareSemver('1.2.0', '1.10.0')), -1);
  assert.equal(Math.sign(compareSemver('2.0.0', '1.9.9')), 1);
  assert.equal(Math.sign(compareSemver('1.2', '1.2.1')), -1);
});

test('formatVersion normalizes to x.y.z', () => {
  assert.equal(formatVersion('1'), '1.0.0');
  assert.equal(formatVersion('1.2'), '1.2.0');
  assert.equal(formatVersion('1.2.3'), '1.2.3');
  assert.equal(formatVersion(''), '1.0.0');
});

test('formatRelativeDate yields human text', () => {
  const now = new Date();
  const oneMinAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  assert.match(formatRelativeDate(oneMinAgo), /minute/);
});

test('uuid creates a v4-like id', () => {
  const id = uuid();
  assert.match(id, /^[0-9a-f\-]{36}$/);
});


