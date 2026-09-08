import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function approve(page) {
  await expect(page.locator('#parent-gate')).toBeVisible();
  const question = await page.locator('#parent-question').textContent();
  const [left, right] = question.match(/\d+/g).map(Number);
  await page.locator('#parent-answer').fill(String(left * right));
  await page.locator('#parent-form').getByRole('button', {name:'Continue', exact:true}).click();
}

test('privacy is complete offline, matches the public policy and returns to settings', async ({ page, context }) => {
  await page.setViewportSize({width:375,height:667});
  await page.goto('/');
  await context.setOffline(true);
  await page.locator('#grownups-open').click();
  await page.locator('#grownups-dialog [data-open-info="privacy"]').click();
  await expect(page.locator('#privacy-dialog')).toBeVisible();
  await expect(page.locator('#parent-gate')).not.toBeVisible();
  await expect(page.locator('#privacy-dialog a[href]')).toHaveCount(0);
  const publicPolicy = (await readFile(new URL('../privacy.html', import.meta.url),'utf8')).match(/<article id="privacy-policy-content">([\s\S]*?)<\/article>/)[1];
  const normalized = await page.evaluate(html => {
    const template=document.createElement('template');template.innerHTML=html;
    return template.content.textContent.replace(/\s+/g,' ').trim();
  },publicPolicy);
  expect((await page.locator('#privacy-dialog .policy-content').textContent()).replace(/\s+/g,' ').trim()).toBe(normalized);
  await expect(page.locator('#privacy-dialog')).toContainText(/backup/i);
  const overflow=await page.locator('#privacy-dialog').evaluate(el=>el.scrollWidth>el.clientWidth+1);
  expect(overflow).toBe(false);
  await page.locator('#privacy-dialog [aria-label="Close privacy policy"]').click();
  await expect(page.locator('#grownups-dialog')).toBeVisible();
  await expect(page.locator('#grownups-dialog [data-open-info="privacy"]')).toBeFocused();
});

test('embedded policy has no context-menu link bypass and its buttons require approval', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(()=>{window.opened=[];window.open=(...args)=>window.opened.push(args);});
  await page.locator('.home-footer [data-open-info="privacy"]').click();
  const link=page.locator('#privacy-dialog .policy-external').first();
  await expect(link).toHaveAttribute('type','button');
  await expect(link).not.toHaveAttribute('href');
  await link.dispatchEvent('auxclick',{button:1});
  await link.dispatchEvent('contextmenu',{button:2});
  expect(await page.evaluate(()=>window.opened)).toEqual([]);
  await link.click();
  await expect(page.locator('#parent-gate')).toBeVisible();
  expect(await page.evaluate(()=>window.opened)).toEqual([]);
  await approve(page);
  expect(await page.evaluate(()=>window.opened)).toEqual([['https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement','_blank','noopener,noreferrer']]);
});

test('every browser export requires an answer; cancel and wrong answers preserve the drawing', async ({ page }) => {
  await page.setViewportSize({width:375,height:667});
  await page.goto('/#draw');
  await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true}));
  const paper=page.locator('.draw-canvas');
  await expect(paper).toBeVisible();
  await paper.click({position:{x:70,y:70}});
  const picture=await paper.evaluate(el=>el.toDataURL());
  await page.locator('.draw-save').click();
  await expect(page.locator('#parent-gate')).toBeVisible();
  await expect(page.locator('.draw-export-dialog')).not.toBeVisible();
  await page.locator('#parent-answer').fill('0');
  await page.locator('#parent-form').getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('#parent-error')).toContainText('did not match');
  await expect(page.locator('.draw-export-dialog')).not.toBeVisible();
  await page.locator('#parent-cancel').click();
  expect(await paper.evaluate(el=>el.toDataURL())).toBe(picture);
  await expect(page.locator('.draw-save')).toBeEnabled();
  await page.locator('.draw-save').click();
  await approve(page);
  await expect(page.locator('.draw-export-image')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.draw-save').click();
  await expect(page.locator('#parent-gate')).toBeVisible();
  await expect(page.locator('#parent-answer')).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(page.locator('#parent-gate')).not.toBeVisible();
  await expect(page.locator('.draw-save')).toBeEnabled();
});

test('share invocation retains the answer submit gesture and fresh navigation cancels pending approval', async ({ page }) => {
  await page.goto('/#draw');
  await page.evaluate(()=>{
    window.shared=[];
    Object.defineProperty(navigator,'canShare',{value:()=>true,configurable:true});
    Object.defineProperty(navigator,'share',{value:async data=>{window.shared.push({name:data.files[0].name,active:navigator.userActivation.isActive});},configurable:true});
  });
  await page.locator('.draw-save').click();
  await approve(page);
  expect(await page.evaluate(()=>window.shared)).toEqual([{name:'my-doodle.png',active:true}]);
  await page.locator('.draw-save').click();
  await page.evaluate(()=>{location.hash='home';});
  await expect(page.locator('#parent-gate')).not.toBeVisible();
  expect(await page.evaluate(()=>window.shared.length)).toBe(1);
  await page.locator('#card-draw').click();
  await page.locator('.draw-save').click();
  await expect(page.locator('#parent-gate')).toBeVisible();
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{value:true,configurable:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#parent-gate')).not.toBeVisible();
  expect(await page.evaluate(()=>window.shared.length)).toBe(1);
});

test('support leaves the app only after approval and only for an allowed destination', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(()=>{window.opened=[];window.open=(...args)=>{window.opened.push({args,active:navigator.userActivation.isActive});return null;};});
  await page.locator('.home-footer [data-open-info="support"]').click();
  await page.getByRole('button',{name:'Visit support website'}).click();
  expect(await page.evaluate(()=>window.opened)).toEqual([]);
  await page.locator('#parent-cancel').click();
  expect(await page.evaluate(()=>window.opened)).toEqual([]);
  await page.getByRole('button',{name:'Visit support website'}).click();
  await approve(page);
  expect(await page.evaluate(()=>window.opened)).toEqual([{args:['https://kartikkp.github.io/Doodle-fun/support.html','_blank','noopener,noreferrer'],active:true}]);
  await page.locator('[data-external-url]').evaluate(el=>el.dataset.externalUrl='https://example.com/unapproved');
  await page.getByRole('button',{name:'Visit support website'}).click();
  await expect(page.locator('#parent-gate')).not.toBeVisible();
  expect(await page.evaluate(()=>window.opened.length)).toBe(1);
});

test('native exports and links delegate to the native gate without a duplicate web question', async ({ page }) => {
  await page.addInitScript(()=>{window.messages=[];window.webkit={messageHandlers:{doodleNative:{postMessage:message=>window.messages.push(message)}}};});
  await page.goto('/');
  await page.locator('.home-footer [data-open-info="support"]').click();
  await page.getByRole('button',{name:'Visit support website'}).click();
  await expect(page.locator('#parent-gate')).not.toBeVisible();
  expect(await page.evaluate(()=>window.messages.filter(m=>m.type==='openExternalURL'))).toEqual([{type:'openExternalURL',url:'https://kartikkp.github.io/Doodle-fun/support.html'}]);
});

for (const route of ['privacy.html','support.html']) {
  test(`${route} loads directly with readable phone layout`, async ({ page }) => {
    await page.setViewportSize({width:375,height:667});
    const response=await page.goto('/'+route);
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
    await expect(page.locator('script[src],link[rel="stylesheet"]')).toHaveCount(0);
  });
}
