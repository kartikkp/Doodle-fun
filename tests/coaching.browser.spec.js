import {test,expect} from '@playwright/test';

test('nine ages select exact starting steps; support applies only to the chosen game and persists',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  for(let age=2;age<=10;age++){
    await page.getByRole('button',{name:`Age ${age}`,exact:true}).click();
    await page.locator('#card-counting').click();
    await page.locator('#coach-open').click();
    await expect(page.locator('#coach-level')).toContainText(`Starting age ${age} · practice step ${age}`);
    if(age===2)await expect(page.locator('#coach-easier')).toBeDisabled();else await expect(page.locator('#coach-easier')).toBeEnabled();
    if(age===10)await expect(page.locator('#coach-harder')).toBeDisabled();else await expect(page.locator('#coach-harder')).toBeEnabled();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.locator('#coach-done').click();
    await page.getByRole('button',{name:'Back to home',exact:true}).click();
  }
  await page.getByRole('button',{name:'Age 6',exact:true}).click();
  await page.locator('#card-counting').click();
  await page.locator('#coach-open').click();
  await page.locator('#coach-easier').click();
  await expect(page.locator('#coach-level')).toContainText('practice step 5');
  await page.locator('#coach-easier').click();
  await expect(page.locator('#coach-easier')).toBeDisabled();
  await page.locator('#coach-done').click();
  await page.getByRole('button',{name:'Back to home',exact:true}).click();
  await page.locator('#card-memory').click();
  await page.locator('#coach-open').click();
  await expect(page.locator('#coach-level')).toContainText('practice step 6');
  await page.goto('/#counting');
  await page.locator('#coach-open').click();
  await expect(page.locator('#coach-level')).toContainText('practice step 4');
  await page.locator('#coach-reset').click();
  await expect(page.locator('#coach-level')).toContainText('practice step 6');
});

test('coach can read a strategy through the native bridge and sound toggles preserve play',async({page})=>{
  await page.addInitScript(()=>{window.nativeMessages=[];window.webkit={messageHandlers:{doodleNative:{postMessage:message=>window.nativeMessages.push(message)}}};});
  await page.goto('/#ten-frame');
  await page.locator('[data-cell]').first().click();
  const before=await page.locator('[data-cell]').first().getAttribute('aria-pressed');
  await page.locator('#coach-sound').click();
  await expect(page.locator('[data-cell]').first()).toHaveAttribute('aria-pressed',before);
  await page.locator('#coach-open').click();
  await page.locator('#coach-hear').click();
  expect(await page.evaluate(()=>nativeMessages.some(m=>m.type==='speak' && m.text.includes('Fill a row')))).toBe(true);
  await page.locator('#coach-done').click();
  expect(await page.evaluate(()=>nativeMessages.at(-1).type)).toBe('stopSpeaking');
});

test('drawing shares a full PNG through the native app bridge',async({page})=>{
  await page.addInitScript(()=>{window.nativeMessages=[];window.webkit={messageHandlers:{doodleNative:{postMessage:message=>window.nativeMessages.push(message)}}};});
  await page.goto('/#draw');
  const canvas=page.locator('.draw-canvas');
  const box=await canvas.boundingBox();
  await page.mouse.move(box.x+box.width*.4,box.y+box.height*.4);
  await page.mouse.down();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6,{steps:12});await page.mouse.up();
  await page.locator('.draw-save').click();
  await expect.poll(()=>page.evaluate(()=>nativeMessages.some(m=>m.type==='shareImage'))).toBe(true);
  const result=await page.evaluate(async()=>{const message=nativeMessages.find(m=>m.type==='shareImage');const image=new Image();image.src=message.dataURL;await image.decode();return {name:message.name,width:image.width,height:image.height,prefix:message.dataURL.slice(0,22)};});
  expect(result).toEqual({name:'my-doodle.png',width:1536,height:1536,prefix:'data:image/png;base64,'});
  await page.evaluate(()=>dispatchEvent(new CustomEvent('doodle-native-share',{detail:{status:'failed'}})));
  await expect(page.locator('.draw-draft-status')).toContainText('Please try Save again.');
  await expect(page.locator('.draw-undo')).toBeEnabled();
});

for(let age=2;age<=10;age++)test(`age ${age}: draw and color, use coaching, recover a change and keep artwork`,async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await page.locator(`[data-age="${age}"]`).tap();
  await page.locator('#card-draw').tap();
  const originalIdea=await page.locator('.draw-challenge').innerText();
  await page.locator('.draw-shuffle').tap();
  await expect(page.locator('.draw-challenge')).not.toHaveText(originalIdea);
  const canvas=page.locator('.draw-canvas'), box=await canvas.boundingBox();
  await page.touchscreen.tap(box.x+box.width*.5,box.y+box.height*.5);
  await expect(page.locator('.draw-undo')).toBeEnabled();
  await page.locator('#coach-open').tap();
  await expect(page.locator('#coach-start')).toContainText('Make a mark');
  if(age>2)await page.locator('#coach-easier').tap();
  await page.locator('#coach-done').tap();
  await expect(page.locator('.draw-undo')).toBeEnabled();
  await page.locator('.draw-undo').tap();
  await expect(page.locator('.draw-redo')).toBeEnabled();
  await page.locator('.draw-redo').tap();
  await page.getByRole('button',{name:'Back to activities',exact:true}).tap();
  await page.locator('#card-coloring').tap();
  await page.getByRole('button',{name:'Color Sunshine',exact:true}).tap();
  const replace=page.getByRole('button',{name:/Start new picture|Replace picture|Start fresh/i});
  if(await replace.isVisible())await replace.click();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Fill',exact:true}).tap();
  const paper=await canvas.boundingBox();await page.touchscreen.tap(paper.x+paper.width*.5,paper.y+paper.height*.5);
  await expect(page.locator('.draw-undo')).toBeEnabled();
  await page.locator('.draw-undo').tap();await page.locator('.draw-redo').tap();
  await context.close();
});
