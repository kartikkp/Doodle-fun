import { test, expect } from '@playwright/test';

test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
async function open(page, id, age = 6) {
  await page.addInitScript(value => localStorage.setItem('doodle-fun:v2:settings', JSON.stringify({ age: value, level: 'auto', sound: false })), age);
  await page.goto(`/#${id}`);
  await expect(page.locator('.discover-title')).toBeVisible();
}
async function expectSuccess(page) {
  await expect(page.locator('.discover-status')).toHaveClass(/is-success/);
  await expect(page.locator('.discover-next')).toHaveClass(/is-ready/);
  await expect(page.locator('.discover-round-count')).toHaveText('1 discovery made');
}

for (const [id, answer] of [['shape-match', 'circle'], ['color-match', 'red']]) {
  test(`${id}: retry, solve, restart without double-credit, and advance`, async ({ page }) => {
    await open(page, id);
    await page.locator(`[data-choice]:not([data-choice="${answer}"])`).first().tap();
    await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);
    await expect(page.locator('.discover-next')).not.toHaveClass(/is-ready/);
    await page.locator(`[data-choice="${answer}"]`).tap();
    await expectSuccess(page);
    await page.locator('.discover-restart').tap();
    await page.locator(`[data-choice="${answer}"]`).tap();
    await expectSuccess(page);
    await page.locator('.discover-next').tap();
    await expect(page.locator('.discover-level')).toContainText('round 2');
    await expect(page.locator('.discover-next')).not.toHaveClass(/is-ready/);
    await expect(page.locator('.discover-hear')).toBeDisabled();
  });
}

test('pattern parade explains retry and accepts the next repeating picture', async ({ page }) => {
  await open(page, 'patterns');
  const first = (await page.locator('.discover-pattern-token').first().getAttribute('aria-label')).split(': ')[1];
  const correct = page.getByRole('button', { name: first, exact: true });
  await page.locator('[data-choice]').filter({ hasNotText: first }).first().tap();
  await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);
  await correct.tap();
  await expectSuccess(page);
  await page.locator('.discover-next').tap();
  await expect(page.locator('.discover-pattern-token')).toHaveCount(7);
});

test('odd-one-out states the property and has a unique different picture', async ({ page }) => {
  await open(page, 'odd-one-out');
  await expect(page.locator('.discover-objective')).toContainText('different color');
  await page.locator('[data-choice]:not([data-choice="0"])').first().tap();
  await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);
  await page.locator('[data-choice="0"]').tap();
  await expectSuccess(page);
  await page.locator('.discover-next').tap();
  await expect(page.locator('.discover-objective')).toContainText('different shape');
});

test('sort every item, recover from a wrong basket, and keep work after navigation', async ({ page }) => {
  await open(page, 'sorting');
  await page.locator('[data-item="cat"]').tap();
  await page.locator('[data-category="fruit"]').tap();
  await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);
  await page.locator('[data-item="cat"]').getAttribute('aria-pressed').then(value => expect(value).toBe('true'));
  await page.locator('[data-category="animals"]').tap();
  await page.getByRole('button', { name: 'Back to activities', exact: true }).tap();
  await page.evaluate(() => { location.hash = 'sorting'; });
  await expect(page.locator('[data-item="cat"]')).toBeDisabled();
  for (const [category, items] of [['animals', ['dog', 'fish']], ['fruit', ['apple', 'banana', 'pear']], ['vehicles', ['car', 'bus', 'bike']]]) {
    for (const item of items) { await page.locator(`[data-item="${item}"]`).tap(); await page.locator(`[data-category="${category}"]`).tap(); }
  }
  await expectSuccess(page);
  await expect(page.locator('.discover-sort-item:disabled')).toHaveCount(9);
  await page.locator('.discover-next').tap();
  await expect(page.locator('.discover-sort-item:enabled')).toHaveCount(9);
});

test('memory mismatch waits for the child and every pair can be completed', async ({ page }) => {
  await open(page, 'memory', 3);
  await expect(page.locator('[data-card]')).toHaveCount(4);
  const seen = new Map();
  let mismatchSeen = false;
  for (let round = 0; round < 16; round++) {
    if (await page.locator('.discover-next.is-ready').count()) break;
    const unmatched = await page.locator('[data-card][data-matched="false"]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.card)));
    const knownPair = unmatched.map(index => [index, seen.get(index)]).find(([index, name]) => name && unmatched.some(other => other !== index && seen.get(other) === name));
    const first = knownPair ? knownPair[0] : unmatched.find(index => !seen.has(index)) ?? unmatched[0];
    await page.locator(`[data-card="${first}"]`).tap();
    const firstName = (await page.locator(`[data-card="${first}"]`).getAttribute('aria-label')).split(', ')[1]; seen.set(first, firstName);
    // One card alone can never be credited as a pair.
    await expect(page.locator(`[data-card="${first}"]`)).toBeDisabled();
    const second = unmatched.find(index => index !== first && seen.get(index) === firstName) ?? unmatched.find(index => index !== first && !seen.has(index)) ?? unmatched.find(index => index !== first);
    await page.locator(`[data-card="${second}"]`).tap();
    const label = await page.locator(`[data-card="${second}"]`).getAttribute('aria-label'); seen.set(second, label.split(', ')[1].replace('matched ', ''));
    if (await page.locator('.discover-memory-hide').count()) {
      mismatchSeen = true;
      await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);
      await expect(page.locator('[data-card]:enabled')).toHaveCount(0);
      await page.locator('.discover-memory-hide').tap();
    }
  }
  await expectSuccess(page);
  await expect(page.locator('[data-matched="true"]')).toHaveCount(4);
  await page.locator('.discover-restart').tap();
  await expect(page.locator('[data-card]:enabled')).toHaveCount(4);
  // Force a mismatch if random initial picks happened to find both pairs directly.
  if (!mismatchSeen) {
    const first = [...seen.keys()][0], second = [...seen.keys()].find(index => seen.get(index) !== seen.get(first));
    await page.locator(`[data-card="${first}"]`).tap(); await page.locator(`[data-card="${second}"]`).tap();
    await expect(page.locator('.discover-memory-hide')).toBeVisible();
    await page.locator('.discover-memory-hide').tap();
    await expect(page.locator('[data-card]:enabled')).toHaveCount(4);
  }
  await page.locator('.discover-next').tap();
  await expect(page.locator('.discover-level')).toContainText('round 2');
});

test('maze blocks teleporting, supports undo and keyboard, and reaches its carrot', async ({ page }) => {
  await open(page, 'maze', 3);
  const map = await page.locator('[data-cell]').evaluateAll(nodes => nodes.map(node => ({ index: Number(node.dataset.cell), neighbors: node.dataset.neighbors.split(',').map(Number), goal: node.dataset.goal === 'true' })));
  expect(map).toHaveLength(16);
  const invalid = map.find(cell => cell.index !== 0 && !map[0].neighbors.includes(cell.index));
  await page.locator(`[data-cell="${invalid.index}"]`).tap();
  await expect(page.locator('[data-current="true"]')).toHaveAttribute('data-cell', '0');
  await expect(page.locator('.discover-status')).toHaveClass(/is-retry/);
  const first = map[0].neighbors[0];
  await page.keyboard.press(first === 1 ? 'ArrowRight' : 'ArrowDown');
  await expect(page.locator('[data-current="true"]')).toHaveAttribute('data-cell', String(first));
  await page.locator('.discover-maze-undo').tap();
  await expect(page.locator('[data-current="true"]')).toHaveAttribute('data-cell', '0');
  const goal = map.find(cell => cell.goal).index, queue = [[0]], visited = new Set([0]);
  let solution;
  while (queue.length) { const path = queue.shift(), cell = path.at(-1); if (cell === goal) { solution = path; break; } for (const next of map[cell].neighbors) if (!visited.has(next)) { visited.add(next); queue.push([...path, next]); } }
  for (const cell of solution.slice(1)) await page.locator(`[data-cell="${cell}"]`).tap();
  await expectSuccess(page);
  await page.locator('.discover-restart').tap();
  await expect(page.locator('[data-current="true"]')).toHaveAttribute('data-cell', '0');
  await page.locator('.discover-next').tap();
  await expect(page.locator('.discover-level')).toContainText('round 2');
});

for (const [age, choices, pairs, cells, items] of [[3, 3, 2, 16, 6], [6, 4, 4, 25, 9], [9, 6, 6, 36, 9]]) {
  test(`age ${age}: meaningful board sizes and phone-safe controls`, async ({ page }) => {
    await open(page, 'shape-match', age);
    await expect(page.locator('[data-choice]')).toHaveCount(choices);
    for (const [id, selector, count] of [['memory', '[data-card]', pairs * 2], ['maze', '[data-cell]', cells], ['sorting', '[data-item]', items]]) {
      await page.evaluate(value => { location.hash = value; }, id);
      await expect(page.locator(selector)).toHaveCount(count);
      const layout = await page.locator('#discovery-view').evaluate(node => ({ overflow: document.documentElement.scrollWidth > innerWidth, targets: [...node.querySelectorAll('button')].filter(button => button.getBoundingClientRect().width > 0).map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })) }));
      expect(layout.overflow).toBe(false);
      for (const target of layout.targets) { expect(target.width).toBeGreaterThanOrEqual(47.5); expect(target.height).toBeGreaterThanOrEqual(47.5); }
    }
  });
}
