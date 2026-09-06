import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {ACTIVITIES} from '../catalog.js';

async function openEveryCard(page) {
  for(const activity of ACTIVITIES) {
    await page.locator(`#card-${activity.id}`).click();
    const view=page.locator({drawing:'#drawing-view',learning:'#learning-view',discovery:'#discovery-view',challenges:'#challenges-view'}[activity.engine]);
    await expect(view).toBeVisible();
    await expect(view.getByRole('heading',{level:1})).toBeVisible();
    await page.keyboard.press('Escape');
    await view.getByRole('button',{name:/Back to (home|activities)/}).click();
    await expect(page.locator('#home-screen')).toBeVisible();
  }
}

test('first launch of every card works after home loads and the network disconnects',async({page,context})=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
  await page.goto('/');
  await expect(page.locator('.activity-card')).toHaveCount(24);
  // Do not open any game or wait for service-worker install before disconnecting.
  await context.setOffline(true);
  await openEveryCard(page);
  expect(errors).toEqual([]);
});

test('offline cache restores the app after its actual server stops',async({page})=>{
  test.setTimeout(90000);
  // Use a private server and actually shut it down. WebKit's offline emulation
  // can bypass worker navigation; this exercises the reported failure directly.
  const server=createServer(async(req,res)=>{
    const worker=req.url.split('?')[0]==='/sw.js';
    res.writeHead(200,{'Content-Type':worker?'text/javascript':'text/html','Cache-Control':'no-store'});
    res.end(await readFile(new URL(worker?'../dist/sw.js':'../dist/index.html',import.meta.url)));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
    await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
    await page.reload();
    await expect(page.locator('.activity-card')).toHaveCount(24);
    await page.locator('#card-maze').click();
    await page.reload();
    await expect(page.locator('#discovery-view')).toBeVisible();
    await expect(page.locator('#discovery-view h1')).toHaveText('Little pathfinder');
  } finally {if(server.listening){server.close();server.closeAllConnections();}}
});

test('downloadable standalone HTML launches all 24 cards without a server',async({browser})=>{
  test.setTimeout(90000);
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(new URL('../dist/index.html',import.meta.url).href);
  await expect(page.locator('.activity-card')).toHaveCount(24);
  await openEveryCard(page);
  expect(errors).toEqual([]);
  await context.close();
});

test('category filters show the complete library and preserve navigation',async({page})=>{
  await page.goto('/');
  for(const [category,count] of [['create',2],['letters',6],['numbers',9],['discover',7],['all',24]]) {
    await page.locator(`[data-filter="${category}"]`).click();
    await expect(page.locator('.activity-card')).toHaveCount(count);
    await expect(page.locator('#activity-count')).toHaveText(`${count} activities`);
  }
  await page.locator('[data-filter="discover"]').click();
  await page.locator('#card-memory').click();
  await page.getByRole('button',{name:/Back to (home|activities)/}).click();
  await expect(page.locator('[data-filter="discover"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#card-memory')).toBeFocused();
});
