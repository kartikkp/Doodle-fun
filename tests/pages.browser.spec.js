import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {ACTIVITIES} from '../catalog.js';

test('branch-published root bundle works under the GitHub project path and reloads after server loss',async({page})=>{
  test.setTimeout(90000);
  const [html,worker]=await Promise.all([readFile(new URL('../index.html',import.meta.url)),readFile(new URL('../sw.js',import.meta.url))]);
  expect(html.equals(await readFile(new URL('../dist/index.html',import.meta.url)))).toBe(true);
  expect(worker.equals(await readFile(new URL('../dist/sw.js',import.meta.url)))).toBe(true);
  const errors=[],unexpected=[];
  page.on('pageerror',error=>errors.push(error.message));
  const server=createServer((req,res)=>{
    const path=new URL(req.url,'http://localhost').pathname;
    if(path==='/Doodle-fun/'||path==='/Doodle-fun/sw.js'){
      const isWorker=path.endsWith('/sw.js');res.writeHead(200,{'Content-Type':isWorker?'text/javascript':'text/html','Cache-Control':'no-store'});res.end(isWorker?worker:html);
    }else{unexpected.push(path);res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    await page.goto(`http://127.0.0.1:${server.address().port}/Doodle-fun/`);
    await expect(page.locator('.activity-card')).toHaveCount(24);
    await expect(page.locator('meta[name="doodle-build"]')).toHaveAttribute('content',/^[a-f0-9]{16}$/);
    await expect(page.locator('script[src],link[rel="stylesheet"]')).toHaveCount(0);
    const script=await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));return navigator.serviceWorker.controller.scriptURL;});
    expect(script).toMatch(/\/Doodle-fun\/sw\.js$/);
    expect(unexpected).toEqual([]);
    await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
    await page.reload();
    await expect(page.locator('.activity-card')).toHaveCount(24);
    for(const activity of ACTIVITIES){
      await page.locator('#card-'+activity.id).click();
      const view=page.locator({drawing:'#drawing-view',learning:'#learning-view',discovery:'#discovery-view',challenges:'#challenges-view'}[activity.engine]);
      await expect(view).toBeVisible();await expect(view.locator('h1')).toBeVisible();
      await page.keyboard.press('Escape');
      await view.getByRole('button',{name:/Back to (home|activities)/}).click();
      await expect(page.locator('#home-screen')).toBeVisible();
    }
    expect(errors).toEqual([]);
  }finally{if(server.listening){server.close();server.closeAllConnections();}}
});
