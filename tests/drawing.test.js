import test from 'node:test';
import assert from 'node:assert/strict';
import { floodFillPixels, createPixelHistory } from '../draw.js';
import { TEMPLATES } from '../templates.js';

const image = (width, height, color = [0, 0, 0, 0]) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set(color, i);
  return { width, height, data };
};
const copy = source => ({ width: source.width, height: source.height, data: source.data.slice() });
const paint = (source, x, y, color) => source.data.set(color, (y * source.width + x) * 4);
const colorAt = (source, x, y) => [...source.data.slice((y * source.width + x) * 4, (y * source.width + x) * 4 + 4)];
const apply = (source, patch, side) => {
  for (let y = 0; y < patch.height; y++) {
    source.data.set(patch[side].subarray(y * patch.width * 4, (y + 1) * patch.width * 4), ((patch.y + y) * source.width + patch.x) * 4);
  }
};

test('fill respects closed line art and reaches every pixel in the region', () => {
  const pixels = image(7, 7);
  for (let i = 1; i < 6; i++) {
    paint(pixels, i, 1, [30, 30, 30, 255]); paint(pixels, i, 5, [30, 30, 30, 255]);
    paint(pixels, 1, i, [30, 30, 30, 255]); paint(pixels, 5, i, [30, 30, 30, 255]);
  }
  assert.equal(floodFillPixels(pixels, 3, 3, [220, 90, 100]), true);
  for (let y = 2; y < 5; y++) for (let x = 2; x < 5; x++) assert.deepEqual(colorAt(pixels, x, y), [220, 90, 100, 255]);
  assert.deepEqual(colorAt(pixels, 0, 0), [0, 0, 0, 0]);
  assert.deepEqual(colorAt(pixels, 1, 3), [30, 30, 30, 255]);
});

test('fill treats erased transparent pixels and white template interiors consistently', () => {
  const pixels = image(5, 3, [255, 255, 255, 255]);
  paint(pixels, 2, 1, [0, 0, 0, 0]);
  assert.equal(floodFillPixels(pixels, 2, 1, [0, 140, 210]), true);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) assert.deepEqual(colorAt(pixels, x, y), [0, 140, 210, 255]);
});

test('fill rejects outside points and unchanged colors without corruption', () => {
  const pixels = image(2, 2), original = pixels.data.slice();
  for (const [x, y] of [[-1, 0], [0, -1], [2, 0], [0, 2], [NaN, 0], [0, Infinity]]) assert.equal(floodFillPixels(pixels, x, y, [120, 80, 200]), false);
  assert.equal(floodFillPixels(pixels, 1, 1, [255, 255, 255]), false);
  assert.deepEqual(pixels.data, original);
});

test('fill handles nearby replacement colors without cycling through painted pixels', () => {
  const pixels = image(60, 60, [100, 100, 100, 255]);
  assert.equal(floodFillPixels(pixels, 30, 30, [110, 110, 110]), true);
  assert.deepEqual(colorAt(pixels, 59, 59), [110, 110, 110, 255]);
});

test('undo/redo exactly roundtrips pen, fill, stamp, eraser, and clear pixel changes', () => {
  const history = createPixelHistory(), paper = image(7, 7), states = [copy(paper)];
  const operations = [
    () => paint(paper, 1, 1, [180, 30, 120, 127]),
    () => floodFillPixels(paper, 4, 4, [70, 140, 200]),
    () => { paint(paper, 3, 3, [200, 190, 15, 255]); paint(paper, 4, 3, [80, 30, 0, 210]); },
    () => paint(paper, 4, 4, [0, 0, 0, 0]),
    () => paper.data.fill(0),
  ];
  for (const action of operations) { const before = copy(paper); action(); assert.equal(history.push(before, paper), true); states.push(copy(paper)); }
  for (let i = states.length - 2; i >= 0; i--) { apply(paper, history.undo(), 'before'); assert.deepEqual(paper.data, states[i].data); }
  assert.equal(history.canUndo, false);
  for (let i = 1; i < states.length; i++) { apply(paper, history.redo(), 'after'); assert.deepEqual(paper.data, states[i].data); }
  assert.equal(history.canRedo, false);
});

test('history stores only changed bounds, skips no-ops, and drops redo after a new mark', () => {
  const history = createPixelHistory(), before = image(100, 100), after = copy(before);
  paint(after, 50, 60, [1, 2, 3, 4]);
  assert.equal(history.push(before, before), false);
  history.push(before, after, { oldName: '', newName: 'Sun' });
  const patch = history.undo();
  assert.equal(patch.x, 50); assert.equal(patch.y, 60); assert.equal(patch.width, 1); assert.equal(patch.height, 1);
  assert.equal(patch.before.byteLength + patch.after.byteLength, 8);
  assert.equal(patch.newName, 'Sun');
  history.push(before, after);
  assert.equal(history.canRedo, false);
});

test('history is bounded by action count and memory while preserving the latest action', () => {
  const history = createPixelHistory({ maxBytes: 20, maxActions: 2 });
  for (let i = 0; i < 5; i++) history.push(image(1, 1, [i, 0, 0, 255]), image(1, 1, [i + 1, 0, 0, 255]));
  assert.ok(history.byteLength <= 20);
  assert.equal(history.undo().after[0], 5);
  assert.equal(history.undo().after[0], 4);
  assert.equal(history.undo(), undefined);
});

test('all nine original coloring pages remain available', () => {
  assert.equal(TEMPLATES.length, 9);
  assert.ok(TEMPLATES.every(template => typeof template.fn === 'function'));
  assert.deepEqual(TEMPLATES.map(template => template.name.split(' ')[0]), ['Sunshine', 'Rainbow', 'House', 'Butterfly', 'Rocket', 'Cat', 'Flower', 'Fish', 'Dino']);
});
