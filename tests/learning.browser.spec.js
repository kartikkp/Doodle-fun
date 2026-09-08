import {test,expect} from '@playwright/test';
import {getLearningItems} from '../learning-data.js';

async function start(page,age=6,activity='letters') {
  await page.addInitScript(age=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto',sound:false})),age);
  await page.goto(`/#${activity}`);
  await expect(page.getByRole('heading',{name:activity==='letters'?'Letter adventures':'Number explorers',exact:true})).toBeVisible();
}
async function trace(page,set,ch,prepare=true) {
  if(prepare){await page.locator(`[data-learn-set="${set}"]`).click();await page.locator(`[data-learn-item="${ch}"]`).click();}
  const board=page.getByTestId('trace-board');await board.scrollIntoViewIfNeeded();
  const rect=await board.boundingBox();
  const paths=getLearningItems(set).find(item=>item.ch===ch).strokes;
  for(const path of paths) {
    await page.mouse.move(rect.x+path[0][0]*rect.width,rect.y+path[0][1]*rect.height);await page.mouse.down();
    for(let i=1;i<path.length;i++) {
      const point=path[i],distance=Math.hypot(point[0]-path[i-1][0],point[1]-path[i-1][1])*rect.width;
      await page.mouse.move(rect.x+point[0]*rect.width,rect.y+point[1]*rect.height,{steps:Math.max(1,Math.min(4,Math.ceil(distance/12)))});
    }
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
  const landscapeBoard=await page.getByTestId('trace-board').boundingBox();
  expect(landscapeBoard.height).toBeLessThanOrEqual(390-70);
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
  await page.getByRole('button',{name:'Count dots',exact:true}).click();
  await page.locator('.learn-count-dot').nth(2).click();await page.locator('.learn-count-dot').nth(0).click();
  await page.getByRole('button',{name:'Trace numbers',exact:true}).click();
  await page.getByRole('button',{name:'Count & play',exact:true}).click();
  await expect(page.locator('.learn-count-dot').nth(2)).toHaveText('1');
  await expect(page.locator('.learn-count-dot').nth(0)).toHaveText('2');
  await page.getByRole('button',{name:'Equal groups',exact:true}).click();
  await expect(page.locator('.learn-equal-group')).toHaveCount(3);
  await expect(page.locator('.learn-count-prompt')).toHaveText('3 groups of 3. How many?');
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
test('smooth round guides render and accept accurate pointer traces at the strictest level',async({page})=>{
  await page.setViewportSize({width:375,height:812});await start(page,10);
  for(const [set,ch]of [['nums','0'],['upper','O'],['upper','Q'],['upper','C'],['lower','o'],['lower','a'],['lower','c'],['lower','g']]) {
    await trace(page,set,ch);
    await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
  }
});
test('older children can complete a word and explore the entire 0–20 count range',async({page})=>{
  await page.setViewportSize({width:1180,height:820});await start(page,9);
  await expect(page.locator('[data-learn-set="words"]')).toHaveAttribute('aria-pressed','true');
  await trace(page,'words','cat');await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
  await page.getByRole('button',{name:'Back to home',exact:true}).click();
  await page.locator('#card-equal-groups').click();
  await expect(page.getByRole('button',{name:'Equal groups',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.learn-count-prompt')).toHaveText('3 groups of 3. How many?');
  await expect(page.locator('.learn-count-dot')).toHaveCount(9);
  await page.getByRole('button',{name:'Count dots',exact:true}).click();
  await expect(page.getByTestId('quantity-frame')).toHaveAttribute('data-quantity','8');
  const seen=new Set();
  for(let i=0;i<21;i++) {
    seen.add(Number(await page.getByTestId('quantity-frame').getAttribute('data-quantity')));
    await page.getByRole('button',{name:'Next puzzle →',exact:true}).click();
  }
  expect([...seen].sort((a,b)=>a-b)).toEqual(Array.from({length:21},(_,i)=>i));
});
test('catalog trails and number activities open their requested practice instead of the age default',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age:9,level:'auto',sound:false})));
  for(const [route,set]of [['prewriting','shapes'],['uppercase','upper'],['lowercase','lower'],['word-tracing','words'],['number-tracing','nums']]) {
    await page.goto(`/#${route}`);
    await expect(page.locator(`[data-learn-set="${set}"]`)).toHaveAttribute('aria-pressed','true');
    await expect(page.getByTestId('trace-board')).toBeVisible();
  }
  for(const [route,label]of [['counting','Count dots'],['addition','Add together'],['equal-groups','Equal groups']]) {
    await page.goto(`/#${route}`);
    await expect(page.getByRole('button',{name:label,exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.getByTestId('quantity-frame')).toBeVisible();
  }
});

for(const age of [2,3,4,5,6,7,8,9,10]) {
  test(`age ${age} traces a complete path in every practice set with a retry and guide`,async({page})=>{
    await page.setViewportSize(age%2?{width:820,height:1180}:{width:375,height:812});
    await page.emulateMedia({reducedMotion:'reduce'});await start(page,age);
    for(const [set,ch]of [['shapes','line'],['upper','A'],['lower','g'],['words','cat'],['nums','0']]) {
      await page.locator(`[data-learn-set="${set}"]`).click();await page.locator(`[data-learn-item="${ch}"]`).click();
      await page.getByRole('button',{name:'Check tracing',exact:true}).click();await expect(page.locator('.learn-feedback')).not.toHaveClass(/is-complete/);
      await page.getByRole('button',{name:'▶ Show me',exact:true}).click();await expect(page.locator('.learn-demo-layer path')).not.toHaveCount(0);
      await page.getByRole('button',{name:'■ Stop guide',exact:true}).click();
      await trace(page,set,ch,false);await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
    }
  });
  test(`age ${age} completes counting, addition and equal groups using counting steps`,async({page})=>{
    await page.setViewportSize(age%2?{width:844,height:390}:{width:375,height:812});await start(page,age,'numbers');
    for(const label of ['Count dots','Add together','Equal groups']) {
      await page.getByRole('button',{name:label,exact:true}).click();
      if(age===10&&label==='Add together')await expect(page.locator('.learn-help')).toContainText('third group');
      const answer=Number(await page.getByTestId('quantity-frame').getAttribute('data-quantity'));
      const wrong=await page.locator('.learn-answer').evaluateAll((buttons,answer)=>buttons.find(button=>Number(button.textContent)!==answer).textContent,answer);
      await page.getByRole('button',{name:`Answer ${wrong}`,exact:true}).click();await expect(page.locator('.learn-feedback')).not.toHaveClass(/is-complete/);
      await page.getByRole('button',{name:'Show counting steps',exact:true}).click();
      await expect(page.locator('.learn-count-dot.is-counted')).toHaveCount(answer);
      await page.getByRole('button',{name:`Answer ${answer}`,exact:true}).click();await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  });
}
test('learning read-aloud toggle preserves ink and counted dots and shared hint supplies a model',async({page})=>{
  await start(page,6);await trace(page,'upper','A');
  const ink=await page.locator('.learn-ink-layer').innerHTML();await page.locator('#coach-sound').click();
  await expect(page.locator('.learn-ink-layer')).toHaveJSProperty('innerHTML',ink);await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
  await page.goto('/#counting');await page.locator('.learn-count-dot').first().click();
  await page.locator('#coach-sound').click();await expect(page.locator('.learn-count-dot.is-counted')).toHaveCount(1);
  await page.locator('#coach-open').click();await page.locator('#coach-hint').click();
  const total=Number(await page.getByTestId('quantity-frame').getAttribute('data-quantity'));
  await expect(page.locator('.learn-count-dot.is-counted')).toHaveCount(total);
});
