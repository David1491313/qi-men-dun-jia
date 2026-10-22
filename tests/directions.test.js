import test from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTIONS, CENTER, normalizeBearing, directionForBearing, palaceLayout } from '../src/features/feng-shui/directions.js';

test('eight bearings use Later Heaven trigrams and Luo Shu palaces', () => {
  const expected = [
    [0, 'N', '坎', 1, '水'], [45, 'NE', '艮', 8, '土'],
    [90, 'E', '震', 3, '木'], [135, 'SE', '巽', 4, '木'],
    [180, 'S', '離', 9, '火'], [225, 'SW', '坤', 2, '土'],
    [270, 'W', '兌', 7, '金'], [315, 'NW', '乾', 6, '金'],
  ];
  for (const [angle, id, trigram, palace, element] of expected) {
    const actual = directionForBearing(angle);
    assert.deepEqual([actual.id, actual.trigram, actual.palace, actual.element], [id, trigram, palace, element]);
  }
});

for (let i = 0; i < 8; i++) {
  const boundary = 22.5 + i * 45;
  test(`boundary ${boundary}° goes clockwise, without rounding adjacent readings`, () => {
    assert.equal(directionForBearing(boundary - 0.000001).id, DIRECTIONS[i].id);
    assert.equal(directionForBearing(boundary).id, DIRECTIONS[(i + 1) % 8].id);
    assert.equal(directionForBearing(boundary + 0.000001).id, DIRECTIONS[(i + 1) % 8].id);
  });
}

test('normalization supports decimals, negatives, multiple turns and zero', () => {
  for (const [input, expected] of [[360, 0], [720, 0], [-360, 0], [-45, 315], ['405', 45], [' 22.5 ', 22.5], ['1e2', 100], [-0, 0], [359.99, 359.99]]) {
    assert.equal(normalizeBearing(input), expected);
  }
  for (const angle of [0, 22.499, 22.5, 90, 337.5, 359.99]) {
    assert.equal(directionForBearing(angle + 720).id, directionForBearing(angle).id);
    assert.equal(directionForBearing(angle - 720).id, directionForBearing(angle).id);
  }
});

test('empty and invalid values never silently become north', () => {
  for (const input of ['', ' ', 'abc', '0x10', Infinity, -Infinity, NaN, null, undefined, false, [], {}, '1e999']) {
    assert.equal(normalizeBearing(input), null);
    assert.equal(directionForBearing(input), null);
  }
});

test('map orientations rotate the same nine palaces, preserving north and center', () => {
  const north = palaceLayout('north');
  const south = palaceLayout('south');
  assert.deepEqual(north.map(p => p.palace), [6, 1, 8, 7, 5, 3, 2, 9, 4]);
  assert.deepEqual(south.map(p => p.palace), [4, 9, 2, 3, 5, 7, 8, 1, 6]);
  assert.deepEqual([...north].reverse(), south);
  assert.equal(new Set(north.map(p => p.palace)).size, 9);
  assert.equal(north[4], CENTER);
  assert.equal(CENTER.trigram, null);
  assert.equal(CENTER.bearing, undefined);
});
