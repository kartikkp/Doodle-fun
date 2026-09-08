import { test, expect } from '@playwright/test';

const canvas = page => page.locator('.draw-canvas');
const snapshot = page => canvas(page).evaluate(el => el.toDataURL());
async function stroke(page, from = [.25, .35], to = [.65, .65]) {
  const box = await canvas(page).boundingBox();
  await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 12 });
  await page.mouse.up();
}
async function tapPaper(page, x = .5, y = .5) {
  const box = await canvas(page).boundingBox();
  await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
}
async function draft(page) {
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('doodle-fun:v2:drawing-draft-v2') || 'null')?.png)).toBeTruthy();
  return page.evaluate(() => JSON.parse(localStorage.getItem('doodle-fun:v2:drawing-draft-v2')).png);
}

async function compareDecodedPaper(page, before, after) {
  return page.evaluate(async ([first, second]) => {
    async function decode(png) {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = png; });
      const paper = document.createElement('canvas'); paper.width = image.width; paper.height = image.height;
      const ctx = paper.getContext('2d'); ctx.drawImage(image, 0, 0);
      return { width: paper.width, height: paper.height, pixels: ctx.getImageData(0, 0, paper.width, paper.height).data };
    }
    const [a, b] = await Promise.all([decode(first), decode(second)]);
    const dimensions = [a.width, a.height, b.width, b.height];
    if (a.width !== b.width || a.height !== b.height) return { dimensions };
    function ink(paper) {
      let count = 0, left = paper.width, right = -1, top = paper.height, bottom = -1;
      for (let i = 0; i < paper.pixels.length; i += 4) {
        if (Math.min(...paper.pixels.subarray(i, i + 3)) >= 240) continue;
        const x = i / 4 % paper.width, y = Math.floor(i / 4 / paper.width);
        count++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      return { count, bounds: [left, top, right, bottom] };
    }
    let maxRGBDelta = 0, maxAlphaDelta = 0, changedPixels = 0;
    for (let i = 0; i < a.pixels.length; i += 4) {
      const delta = Math.max(Math.abs(a.pixels[i] - b.pixels[i]), Math.abs(a.pixels[i + 1] - b.pixels[i + 1]), Math.abs(a.pixels[i + 2] - b.pixels[i + 2]));
      maxRGBDelta = Math.max(maxRGBDelta, delta);
      maxAlphaDelta = Math.max(maxAlphaDelta, Math.abs(a.pixels[i + 3] - b.pixels[i + 3]));
      if (delta > 0) changedPixels++;
    }
    return { dimensions, maxRGBDelta, maxAlphaDelta, changedPixels, pixelCount: a.width * a.height, beforeInk: ink(a), afterInk: ink(b) };
  }, [before, after]);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#draw');
  await expect(canvas(page)).toBeVisible();
  await expect.poll(() => canvas(page).evaluate(el => el.width)).toBeGreaterThan(100);
});

test('pen, eraser, and fill have exact single-step undo and redo', async ({ page }) => {
  const blank = await snapshot(page);
  await stroke(page);
  const pen = await snapshot(page); expect(pen).not.toBe(blank);
  await page.getByRole('button', { name: 'Undo last action', exact: true }).click();
  expect(await snapshot(page)).toBe(blank);
  await page.getByRole('button', { name: 'Redo last action', exact: true }).click();
  expect(await snapshot(page)).toBe(pen);
  await page.getByRole('button', { name: 'Eraser', exact: true }).click();
  await stroke(page, [.4, .2], [.4, .8]);
  const erased = await snapshot(page); expect(erased).not.toBe(pen);
  await page.getByRole('button', { name: 'Undo last action', exact: true }).click();
  expect(await snapshot(page)).toBe(pen);
  await page.getByRole('button', { name: 'Redo last action', exact: true }).click();
  expect(await snapshot(page)).toBe(erased);
  await page.getByRole('button', { name: 'Blue', exact: true }).click();
  await page.getByRole('button', { name: 'Fill', exact: true }).click();
  await tapPaper(page, .05, .05);
  const filled = await snapshot(page); expect(filled).not.toBe(erased);
  await page.getByRole('button', { name: 'Undo last action', exact: true }).click();
  expect(await snapshot(page)).toBe(erased);
  await page.getByRole('button', { name: 'Redo last action', exact: true }).click();
  expect(await snapshot(page)).toBe(filled);
});

test('stamps, clear, and page replacement preserve recoverable artwork', async ({ page }) => {
  const blank = await snapshot(page);
  await page.getByRole('button', { name: 'Stamps', exact: true }).click();
  await expect(page.locator('.draw-stamp-choice')).toHaveCount(20);
  await page.getByRole('button', { name: 'Star stamp', exact: true }).click();
  await tapPaper(page);
  const stamped = await snapshot(page); expect(stamped).not.toBe(blank);
  await page.locator('.draw-new').click();
  await page.getByRole('button', { name: 'Keep drawing', exact: true }).click();
  expect(await snapshot(page)).toBe(stamped);
  await page.locator('.draw-new').click();
  await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
  expect(await snapshot(page)).toBe(blank);
  await page.getByRole('button', { name: 'Undo last action', exact: true }).click();
  expect(await snapshot(page)).toBe(stamped);
  await page.locator('.draw-templates').click();
  await page.getByRole('button', { name: /Color Sunshine/ }).click();
  await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
  const coloringPage = await snapshot(page); expect(coloringPage).not.toBe(stamped);
  await page.getByRole('button', { name: 'Undo last action', exact: true }).click();
  expect(await snapshot(page)).toBe(stamped);
  await page.getByRole('button', { name: 'Redo last action', exact: true }).click();
  expect(await snapshot(page)).toBe(coloringPage);
});

// Interior targets are selected from the visible line art, away from its edges.
// They match the physical-touch native regression so neither suite can pass by
// recoloring an outline or the empty background instead of a coloring region.
const coloringRegions = [
  { name: 'Sunshine', point: [.50, .32] },
  { name: 'Rainbow', point: [.50, .39] },
  { name: 'House', point: [.50, .52] },
  { name: 'Butterfly', point: [.32, .64] },
  { name: 'Rocket', point: [.50, .45] },
  { name: 'Cat', point: [.50, .25] },
  { name: 'Flower', point: [.50, .40] },
  { name: 'Fish', point: [.50, .50] },
  { name: 'Dino', point: [.46, .57] },
];

async function coloringMetrics(page, beforePNG, point) {
  return canvas(page).evaluate(async (el, { beforePNG, point }) => {
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = beforePNG; });
    const original = document.createElement('canvas'); original.width = el.width; original.height = el.height;
    original.getContext('2d').drawImage(image, 0, 0);
    const before = original.getContext('2d').getImageData(0, 0, el.width, el.height).data;
    const after = el.getContext('2d').getImageData(0, 0, el.width, el.height).data;
    const isWhite = (r, g, b) => Math.min(r, g, b) > 240;
    const isCoral = (r, g, b) => r > 175 && g < 175 && b < 195 && r - g > 45;
    function fraction(pixels, at, predicate) {
      const cx = Math.round(el.width * at[0]), cy = Math.round(el.height * at[1]);
      const radius = Math.max(1, Math.floor(el.width * .008));
      let matched = 0, count = 0;
      for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
          const i = (y * el.width + x) * 4; count++;
          if (predicate(pixels[i], pixels[i + 1], pixels[i + 2])) matched++;
        }
      }
      return matched / count;
    }
    let dark = 0, preserved = 0;
    for (let i = 0; i < before.length; i += 4) {
      if (Math.max(before[i], before[i + 1], before[i + 2]) >= 80) continue;
      dark++;
      if (Math.max(after[i], after[i + 1], after[i + 2]) < 80) preserved++;
    }
    return { interiorBefore: fraction(before, point, isWhite), exteriorBefore: fraction(before, [.06, .10], isWhite),
      interiorAfter: fraction(after, point, isCoral), exteriorAfter: fraction(after, [.06, .10], isWhite),
      dark, retained: preserved / dark };
  }, { beforePNG, point });
}

test('all nine coloring templates keep interior fills inside dark outlines', async ({ page }) => {
  test.setTimeout(90000);
  for (const [index, { name, point }] of coloringRegions.entries()) {
    await page.locator('.draw-templates').click();
    await expect(page.locator('.draw-template-card')).toHaveCount(9);
    await page.getByRole('button', { name: new RegExp(`Color ${name}`) }).click();
    if (index) await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
    await expect(page.locator('.draw-paper-name')).toContainText(name);
    const initial = await snapshot(page);
    await page.getByRole('button', { name: 'Coral', exact: true }).click();
    await tapPaper(page, ...point);
    const metrics = await coloringMetrics(page, initial, point);
    expect(metrics.interiorBefore, `${name}: chosen region starts empty`).toBeGreaterThan(.95);
    expect(metrics.exteriorBefore, `${name}: exterior starts empty`).toBeGreaterThan(.95);
    expect(metrics.interiorAfter, `${name}: fill colors the intended interior`).toBeGreaterThan(.95);
    expect(metrics.exteriorAfter, `${name}: fill must not leak into the exterior`).toBeGreaterThan(.95);
    expect(metrics.dark, `${name}: substantial line art is visible`).toBeGreaterThan(100);
    expect(metrics.retained, `${name}: filling keeps dark outlines`).toBeGreaterThan(.99);
    await page.getByRole('button', { name: 'Undo last action', exact: true }).click();
    expect(await snapshot(page)).toBe(initial);
  }
});

test('rotation, home navigation, and reload keep the same saved artwork', async ({ page }) => {
  await stroke(page);
  const original = await draft(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(canvas(page)).toBeVisible();
  await expect.poll(() => canvas(page).evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'Back to activities', exact: true }).click();
  await page.locator('#card-draw').click();
  await expect(canvas(page)).toBeVisible();
  expect(await draft(page)).toBe(original);
  const rotated = await snapshot(page);
  await page.reload();
  await expect(page.locator('.draw-draft-status')).toHaveText('Your last picture is ready');
  const restored = await compareDecodedPaper(page, rotated, await snapshot(page));
  expect(restored.dimensions.slice(0, 2)).toEqual(restored.dimensions.slice(2));
  expect(restored.beforeInk.count).toBeGreaterThan(100);
  expect(restored.afterInk).toEqual(restored.beforeInk);
  expect(restored.maxAlphaDelta).toBe(0);
  // Linux WebKit's transparent PNG restore rounds a few antialiased RGB values:
  // CI showed 200/252,004 pixels changing by one level, with identical ink geometry.
  // Preserve exact geometry/alpha and allow only that bounded color rounding.
  expect(restored.maxRGBDelta).toBeLessThanOrEqual(1);
  expect(restored.changedPixels / restored.pixelCount).toBeLessThanOrEqual(.005);
  // The full-resolution backing PNG itself must remain byte-for-byte unchanged.
  expect(await draft(page)).toBe(original);
});

test('saving generates a real full-resolution PNG with a white paper background', async ({ page }) => {
  // Exercise download fallback without opening the system share sheet.
  await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }));
  await stroke(page);
  await page.locator('.draw-save').click();
  const image = page.locator('.draw-export-image');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(el => el.naturalWidth)).toBe(1536);
  const result = await image.evaluate(async el => {
    const copy = document.createElement('canvas'); copy.width = copy.height = 1536;
    const ctx = copy.getContext('2d'); ctx.drawImage(el, 0, 0);
    return { corner: [...ctx.getImageData(0, 0, 1, 1).data], signature: [...new Uint8Array(await (await fetch(el.src)).arrayBuffer()).slice(0, 8)] };
  });
  expect(result.corner).toEqual([255, 255, 255, 255]);
  expect(result.signature).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  await expect(page.locator('.draw-download')).toHaveAttribute('download', 'my-doodle.png');
});

test('pointer cancellation ends the active stroke and ignores another pointer', async ({ page }) => {
  const box = await canvas(page).boundingBox();
  await canvas(page).evaluate(el => el.addEventListener('pointerdown', event => { el.dataset.pointerId = String(event.pointerId); }));
  await page.mouse.move(box.x + box.width * .3, box.y + box.height * .3);
  await page.mouse.down();
  const mark = await snapshot(page);
  await canvas(page).evaluate(el => {
    const pointerId = Number(el.dataset.pointerId);
    el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 999, pointerType: 'touch', clientX: 10, clientY: 10 }));
    el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 999, pointerType: 'touch', clientX: 300, clientY: 300 }));
    el.dispatchEvent(new PointerEvent('pointercancel', { pointerId, pointerType: 'mouse' }));
  });
  await page.mouse.move(box.x + box.width * .7, box.y + box.height * .7);
  await page.mouse.up();
  expect(await snapshot(page)).toBe(mark);
  await expect(page.getByRole('button', { name: 'Undo last action', exact: true })).toBeEnabled();
  await stroke(page, [.2, .7], [.7, .2]);
  expect(await snapshot(page)).not.toBe(mark);
});

test.describe('finger input', () => {
  test.use({ hasTouch: true });
  test('real touch paints and a second finger cannot take over the drawing', async ({ page, browserName }) => {
    const blank = await snapshot(page), box = await canvas(page).boundingBox();
    await page.touchscreen.tap(box.x + box.width * .5, box.y + box.height * .5);
    expect(await snapshot(page)).not.toBe(blank);
    await page.getByRole('button', { name: 'Undo last action', exact: true }).click();
    expect(await snapshot(page)).toBe(blank);
    if (browserName === 'chromium') {
      const session = await page.context().newCDPSession(page);
      const first = { id: 11, x: box.x + box.width * .2, y: box.y + box.height * .8 };
      const second = { id: 22, x: box.x + box.width * .8, y: box.y + box.height * .2 };
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first, second] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [first, { ...second, y: box.y + box.height * .3 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const colors = await canvas(page).evaluate(el => {
        const ctx = el.getContext('2d');
        return { first: [...ctx.getImageData(el.width * .2, el.height * .8, 1, 1).data], second: [...ctx.getImageData(el.width * .8, el.height * .3, 1, 1).data] };
      });
      expect(colors.first).not.toEqual([255, 255, 255, 255]);
      expect(colors.second).toEqual([255, 255, 255, 255]);
      await session.detach();
    }
  });
});
