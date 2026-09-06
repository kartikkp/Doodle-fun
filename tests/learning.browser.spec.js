import {test,expect} from '@playwright/test';
import {getLearningItems} from '../learning-data.js';

async function start(page,age=6,activity='letters') {
  await page.addInitScript(age=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:false})),age);
  await page.goto(`/#${activity}`);
  await expect(page.getByRole('heading',{name:activity==='letters'?'Letter adventures':'Number explorers',exact:true})).toBeVisible();
}
async function trace(page,set,ch) {
  await page.locator(`[data-learn-set="${set}"]`).click();
  await page.locator(`[data-learn-item="${ch}"]`).click();
  const board=page.getByTestId('trace-board');await board.scrollIntoViewIfNeeded();
  const rect=await board.boundingBox();
  const paths=getLearningItems(set).find(item=>item.ch===ch).strokes;
  for(const path of paths) {
    await page.mouse.move(rect.x+path[0][0]*rect.width,rect.y+path[0][1]*rect.height);await page.mouse.down();
    for(const point of path.slice(1))await page.mouse.move(rect.x+point[0]*rect.width,rect.y+point[1]*rect.height,{steps:4});
    await page.mouse.up();
  }
}
test('phone tracing rejects taps and incomplete letters, then credits real paths and persists progress',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page);
  const board=page.getByTestId('trace-board');const rect=await board.boundingBox();
  await page.mouse.click(rect.x+rect.width*.05,rect.y+rect.height*.05);
  await page.getByRole('button',{name:'Check tracing',exact:true}).click();
  await expect(page.locator('.learn-feedback')).not.toHaveClass(/is-complete/);
  await page.getByRole('button',{name:'↺ Start again',exact:true}).click();
  await trace(page,'upper','A');
  await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
  await expect(page.locator('[data-learn-item="A"]')).toHaveClass(/is-practiced/);
  await page.reload();
  await expect(page.locator('[data-learn-item="A"]')).toHaveClass(/is-practiced/);
  await expect(page.locator('.learn-feedback')).toContainText('You practiced A');
});
test('tracing ink survives rotation and guide timers stop when changing item',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page,3);
  await trace(page,'shapes','line');
  const ink=await page.locator('.learn-ink-layer').innerHTML();
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('.learn-ink-layer')).toHaveJSProperty('innerHTML',ink);
  await page.locator('[data-learn-item="circle"]').click();
  await page.getByRole('button',{name:'▶ Show me',exact:true}).click();
  await expect(page.getByRole('button',{name:'■ Stop guide',exact:true})).toBeVisible();
  await page.locator('[data-learn-item="across"]').click();
  await expect(page.locator('.learn-demo-layer')).toBeEmpty();
  await expect(page.getByRole('button',{name:'▶ Show me',exact:true})).toBeVisible();
  await expect(page.locator('.learn-item-title')).toHaveText('Across');
  await expect(page.locator('.learn-feedback')).toContainText('Start at 1');
});
test('age starting points keep all letter, lowercase, number, shape and word sets available',async({page})=>{
  await page.setViewportSize({width:820,height:1180});await start(page,3);
  await expect(page.locator('[data-learn-set="shapes"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-learn-set="lower"]').click();await expect(page.locator('.learn-choice')).toHaveCount(26);
  await page.locator('[data-learn-set="nums"]').click();await expect(page.locator('.learn-choice')).toHaveCount(10);
  await expect(page.locator('[data-learn-item="0"]')).toBeVisible();
  await trace(page,'lower','g');await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
  await page.locator('[data-learn-set="words"]').click();await expect(page.locator('.learn-choice')).toHaveCount(6);
  await expect(page.locator('[data-learn-set="upper"]')).toBeVisible();
});
test('zero has an empty group and count/addition questions give recoverable feedback',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page,3,'numbers');
  await expect(page.getByTestId('quantity-frame')).toHaveAttribute('data-quantity','0');
  await expect(page.locator('.learn-count-dot')).toHaveCount(0);
  await page.getByRole('button',{name:'Answer 1',exact:true}).click();
  await expect(page.locator('.learn-feedback')).toContainText('try another number');
  await page.getByRole('button',{name:'Answer 0',exact:true}).click();
  await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
  await page.getByRole('button',{name:'Next puzzle →',exact:true}).click();
  await expect(page.locator('.learn-count-dot')).toHaveCount(1);
  await page.locator('.learn-count-dot').click();await expect(page.locator('.learn-count-dot')).toHaveText('1');
  await page.getByRole('button',{name:'Add together',exact:true}).click();
  await expect(page.locator('.learn-count-prompt')).toHaveText('1 + 0 = ?');
  await page.getByRole('button',{name:'Answer 1',exact:true}).click();
  await expect(page.locator('.learn-feedback')).toContainText('1 + 0 = 1');
  await page.getByRole('button',{name:'Trace numbers',exact:true}).click();
  await trace(page,'nums','0');await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('counting retains tap order between panels and equal-group totals match visible dots',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page,9,'numbers');
  await page.locator('.learn-count-dot').nth(2).click();await page.locator('.learn-count-dot').nth(0).click();
  await page.getByRole('button',{name:'Trace numbers',exact:true}).click();
  await page.getByRole('button',{name:'Count & play',exact:true}).click();
  await expect(page.locator('.learn-count-dot').nth(2)).toHaveText('1');
  await expect(page.locator('.learn-count-dot').nth(0)).toHaveText('2');
  await page.getByRole('button',{name:'Equal groups',exact:true}).click();
  await expect(page.locator('.learn-equal-group')).toHaveCount(2);
  const count=Number(await page.getByTestId('quantity-frame').getAttribute('data-quantity'));
  await expect(page.locator('.learn-count-dot')).toHaveCount(count);
  await page.getByRole('button',{name:`Answer ${count}`,exact:true}).click();
  await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('shared stroke starts display separate readable badges',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page);
  const circles=await page.locator('.learn-marker-layer circle').evaluateAll(nodes=>nodes.map(node=>({x:Number(node.getAttribute('cx')),y:Number(node.getAttribute('cy')),r:Number(node.getAttribute('r'))})));
  expect(circles).toHaveLength(3);
  expect(Math.hypot(circles[0].x-circles[1].x,circles[0].y-circles[1].y)).toBeGreaterThan(circles[0].r+circles[1].r);
  await expect(page.locator('.learn-marker-layer text')).toHaveText(['1','2','3']);
});
test('older children can complete a word and explore the entire 0–20 count range',async({page})=>{
  await page.setViewportSize({width:1180,height:820});await start(page,9);
  await expect(page.locator('[data-learn-set="words"]')).toHaveAttribute('aria-pressed','true');
  await trace(page,'words','cat');await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
  await page.getByRole('button',{name:'Back to home',exact:true}).click();
  await page.locator('#card-numbers').click();
  const seen=new Set();
  for(let i=0;i<21;i++) {
    seen.add(Number(await page.getByTestId('quantity-frame').getAttribute('data-quantity')));
    await page.getByRole('button',{name:'Next puzzle →',exact:true}).click();
  }
  expect([...seen].sort((a,b)=>a-b)).toEqual(Array.from({length:21},(_,i)=>i));
});
