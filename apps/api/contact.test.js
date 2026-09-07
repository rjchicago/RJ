import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRateLimiter,
  formatEmailHtml,
  formatEmailText,
  getClientIp,
  validateSubmission,
} from './contact.js';

const valid = (overrides = {}) => ({
  name: 'R J',
  email: 'rj@example.com',
  message: 'This is a sufficiently long message.',
  ...overrides,
});

test('accepts a valid minimal submission', () => {
  const result = validateSubmission(valid());
  assert.deepEqual(result.errors, []);
  assert.equal(result.submission.name, 'R J');
});

test('rejects honeypot submissions', () => {
  assert.match(validateSubmission(valid({ website: 'bot' })).errors[0], /Invalid submission/);
});

test('rejects invalid and overlong email values', () => {
  assert.ok(validateSubmission(valid({ email: 'not-an-email' })).errors.includes('A valid email is required.'));
  assert.ok(validateSubmission(valid({ email: `${'a'.repeat(180)}@example.com` })).errors.includes('A valid email is required.'));
});

test('enforces message boundaries', () => {
  assert.notEqual(validateSubmission(valid({ message: 'a'.repeat(19) })).errors.length, 0);
  assert.equal(validateSubmission(valid({ message: 'a'.repeat(20) })).errors.length, 0);
  assert.equal(validateSubmission(valid({ message: 'a'.repeat(3000) })).errors.length, 0);
  assert.notEqual(validateSubmission(valid({ message: 'a'.repeat(3001) })).errors.length, 0);
});

test('enforces optional-field limits', () => {
  assert.ok(validateSubmission(valid({ organization: 'a'.repeat(161) })).errors.includes('Organization is too long.'));
  assert.ok(validateSubmission(valid({ timeframe: 'a'.repeat(121) })).errors.includes('Timeframe is too long.'));
  assert.ok(validateSubmission(valid({ audience: 'a'.repeat(121) })).errors.includes('Audience is too long.'));
  assert.ok(validateSubmission(valid({ source: 'a'.repeat(181) })).errors.includes('Source is too long.'));
});

test('escapes all HTML special characters and preserves text newlines', () => {
  const submission = validateSubmission(valid({ name: `<&>"'`, message: 'line one\nline two with <tag>' })).submission;
  const html = formatEmailHtml(submission);
  assert.match(html, /&lt;&amp;&gt;&quot;&#039;/);
  assert.doesNotMatch(html, /<tag>/);
  assert.match(html, /line one<br>line two/);
  assert.match(formatEmailText(submission), /line one\nline two/);
});

test('rate limiter limits the sixth request and resets after its window', () => {
  const limited = createRateLimiter({ windowMs: 100, maxRequests: 5 });
  for (let i = 0; i < 5; i += 1) assert.equal(limited('one', 0), false);
  assert.equal(limited('one', 0), true);
  assert.equal(limited('two', 0), false);
  assert.equal(limited('one', 101), false);
});

test('uses socket IP by default and forwarded IP only when proxy is trusted', () => {
  const request = { headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }, socket: { remoteAddress: '192.0.2.1' } };
  assert.equal(getClientIp(request), '192.0.2.1');
  assert.equal(getClientIp(request, { trustProxy: true }), '203.0.113.5');
  assert.equal(getClientIp({ headers: { 'x-forwarded-for': ' , ' }, socket: { remoteAddress: '192.0.2.1' } }, { trustProxy: true }), '192.0.2.1');
});
