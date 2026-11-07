import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validateNumber, validateExpiry, validateCvv, parseExpiry, formatPan,
  normalizePan, luhnCheck, detectNetwork, MESSAGES,
} from '../../web/js/validator.js';

const vectors = JSON.parse(readFileSync(new URL('../../test-vectors/cards.json', import.meta.url)));

test('shared vectors: card numbers match the C++ core', async (t) => {
  for (const v of vectors.cards) {
    await t.test(`"${v.pan}"`, () => {
      const r = validateNumber(v.pan);
      assert.equal(r.network, v.network);
      assert.equal(r.luhn, v.luhn);
      assert.equal(r.valid, v.valid);
    });
  }
});

test('shared vectors: expiry', async (t) => {
  for (const v of vectors.expiry) {
    await t.test(`${v.month}/${v.year}`, () => {
      const ok = validateExpiry(v.month, v.year, { year: v.now[0], month: v.now[1] }).length === 0;
      assert.equal(ok, v.valid);
    });
  }
});

test('shared vectors: cvv', async (t) => {
  for (const v of vectors.cvv) {
    await t.test(`${v.cvv} (${v.network})`, () => {
      assert.equal(validateCvv(v.cvv, v.network).length === 0, v.valid);
    });
  }
});

test('normalizePan strips separators and rejects other characters', () => {
  assert.equal(normalizePan('4111 1111-1111 1111'), '4111111111111111');
  assert.equal(normalizePan('4111.1111'), null);
});

test('luhnCheck rejects empty input', () => {
  assert.equal(luhnCheck(''), false);
});

test('RuPay wins the 65xxxx overlap with Discover', () => {
  assert.equal(detectNetwork('6530000000000000').id, 'rupay');
  assert.equal(detectNetwork('6540000000000000').id, 'discover');
});

test('formatPan groups digits per network', () => {
  assert.equal(formatPan('4111111111111111'), '4111 1111 1111 1111');
  assert.equal(formatPan('378282246310005'), '3782 822463 10005');
  assert.equal(formatPan('41111'), '4111 1');
});

test('parseExpiry accepts common formats', () => {
  assert.deepEqual(parseExpiry('04 / 29'), { month: 4, year: 2029 });
  assert.deepEqual(parseExpiry('0429'), { month: 4, year: 2029 });
  assert.deepEqual(parseExpiry('4/29'), { month: 4, year: 2029 });
  assert.equal(parseExpiry('04/2029'), null);
  assert.equal(parseExpiry('ab/cd'), null);
});

test('every error code has a plain-language message', () => {
  for (const v of vectors.cards) {
    for (const code of validateNumber(v.pan).errors) {
      assert.ok(MESSAGES[code], `missing message for ${code}`);
      assert.match(MESSAGES[code], /\.$/, 'messages are full sentences');
    }
  }
});
