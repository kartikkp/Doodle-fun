import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {buildStudioRound,solvePour,solveBalance} from '../studio-play.js';

test.use({hasTouch:true,viewport:{width:375,height:812}});
// Exercise the real controller and shared styles without rebuilding a bundle
// while other workers edit the app shell. App routing has separate integration QA.
async function start(page,id,age=6){
  await page.route('**/__studio_qa__/*',async route=>{
    const name=new URL(route.request().url()).pathname.split('/').at(-1);
    if(name==='index.html')return route.fulfill({contentType:'text/html',body:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="studio-play.css"><main id="studio"></main><script type="module">import {createStudioPlay} from './studio-play.js';import {getModeProgress,getCurrentRound,getProgress} from './progression.js';const query=new URLSearchParams(location.search);window.settings={age:Number(query.get('age')),level:'auto',sound:false};window.controller=createStudioPlay(document.querySelector('#studio'),{getSettings:()=>settings});window.score=()=>getModeProgress(query.get('id'),settings.age,settings.age);window.currentRound=getCurrentRound;window.allProgress=getProgress;controller.open(query.get('id'));</script>`});
    if(!['studio-play.js','core.js','progression.js','audio.js','audio-startup.js','studio-play.css','styles.css'].includes(name))return route.abort();
    return route.fulfill({contentType:name.endsWith('.css')?'text/css':'text/javascript',body:await readFile(new URL(`../${name}`,import.meta.url),'utf8')});
  });
  await page.goto(`/__studio_qa__/index.html?id=${id}&age=${age}`);await expect(page.locator('.studio-title')).toBeVisible();
  return buildStudioRound(id,age);
}
async function solve(page,id,round){
  if(id==='mirror-mosaic'){
    for(let color=1;color<=round.colors;color++){
      await page.locator(`.studio-palette [data-color="${color}"]`).tap();
      for(let cell=0;cell<round.solution.length;cell++)if(!round.sources.includes(cell)&&round.solution[cell]===color)await page.locator(`button[data-cell="${cell}"]`).tap();
    }
  }else if(id==='balance-lab'){
    for(const value of solveBalance(round)){
      await page.locator(`[data-weight="${value}"]`).tap();await page.locator('[data-pan="1"]').tap();
    }
  }else for(const [from,to]of solvePour(round)){await page.locator(`[data-jug="${from}"]`).tap();await page.locator(`[data-jug="${to}"]`).tap();}
  await page.locator('.studio-check').tap();await expect(page.locator('.studio-status')).toHaveClass(/is-success/);
}

for(let age=2;age<=10;age++)for(const id of ['mirror-mosaic','balance-lab','measure-pour']){
  test(`${id} age ${age}: touch solution, explicit check, reversible reset, and honest scoring`,async({page})=>{
    const round=await start(page,id,age);
    expect(await page.evaluate(()=>currentRound())).toMatchObject({age,step:age,scored:true});
    await page.locator('.studio-check').tap();await expect(page.locator('.studio-status')).toHaveClass(/is-retry/);
    const before=await page.locator('.studio-play').innerHTML();await page.locator('.studio-hint').tap();expect(await page.locator('.studio-play').innerHTML()).toBe(before);
    await expect(page.locator('.studio-status')).toHaveClass(/is-hint/);await solve(page,id,round);
    expect(await page.evaluate(()=>score())).toMatchObject({completed:1,rounds:{0:{done:true,mistake:true,hint:true}}});
    await page.locator('.studio-reset').tap();await expect(page.locator('.studio-check')).toBeEnabled();
    await page.locator('.studio-undo').tap();await page.locator('.studio-check').tap();
    await expect(page.locator('.studio-status')).toHaveClass(/is-success/);expect((await page.evaluate(()=>score())).completed).toBe(1);
    await page.reload();await expect(page.locator('.studio-round')).toContainText('Challenge 2');
  });
}

for(const viewport of [{width:320,height:568},{width:375,height:812},{width:667,height:375},{width:1024,height:768}]){
  test(`studio touch targets and overflow at ${viewport.width} by ${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    for(const id of ['mirror-mosaic','balance-lab','measure-pour','beat-maker']){
      await start(page,id,10);
      await expect.poll(()=>page.locator('.studio-screen').evaluate(root=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,small:[...root.querySelectorAll('button')].map(node=>({label:node.textContent,width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height})).filter(box=>box.width>0&&(box.width<47.5||box.height<47.5))}))).toEqual({overflow:false,small:[]});
    }
  });
}

test('ungraded mirror creation makes reflections and never earns a medal',async({page})=>{
  await start(page,'mirror-mosaic',8);await page.locator('.studio-free').tap();
  expect(await page.evaluate(()=>currentRound())).toMatchObject({scored:false});await expect(page.locator('.studio-check')).toBeHidden();
  await page.locator('button[data-cell="0"]').tap();expect(await page.locator('.studio-mirror-cell[data-color="1"]').count()).toBe(4);
  await page.locator('.studio-hint').tap();await expect(page.locator('.studio-status')).toContainText('Place a tile near');expect((await page.evaluate(()=>score())).completed).toBe(0);
  await page.locator('.studio-undo').tap();expect(await page.locator('.studio-mirror-cell[data-color="1"]').count()).toBe(0);
});

test('older balance keeps its clue indirect and rejects a level pan that breaks the piece rule',async({page})=>{
  await start(page,'balance-lab',10);
  await expect(page.locator('.studio-unit-clue')).toHaveText('? + ? + ? + 1 = 7');
  await expect(page.locator('.studio-objective')).toHaveText('Balance with exactly 4 weights.');
  for(const weight of [5,5,2]){await page.locator(`[data-weight="${weight}"]`).tap();await page.locator('[data-pan="1"]').tap();}
  await expect(page.locator('.studio-balance-observation')).toHaveText('The pans are level.');
  await page.locator('.studio-check').tap();await expect(page.locator('.studio-status')).toHaveClass(/is-retry/);
  expect((await page.evaluate(()=>score())).completed).toBe(0);
  await page.getByRole('button',{name:'Remove 2 units from right pan',exact:true}).tap();
  await page.locator('[data-weight="1"]').tap();await page.locator('[data-pan="1"]').tap();await page.locator('[data-pan="1"]').tap();
  await page.locator('.studio-check').tap();await expect(page.locator('.studio-status')).toHaveClass(/is-success/);
});

test('fractional pouring keeps a common visual unit and changes to a distinct planning task',async({page})=>{
  const round=await start(page,'measure-pour',10);
  const pixelsPerUnit=await page.locator('.studio-jug-picture').evaluateAll((jugs,capacities)=>jugs.map((jug,i)=>jug.getBoundingClientRect().height/capacities[i]),round.capacities);
  expect(Math.max(...pixelsPerUnit)-Math.min(...pixelsPerUnit)).toBeLessThan(.25);
  expect(solvePour(round).length).toBeGreaterThanOrEqual(10);
  const goal=await page.locator('.studio-objective').textContent();
  await page.locator('[data-jug="0"]').tap();await page.locator('[data-jug="1"]').tap();
  expect(await page.evaluate(()=>score())).toMatchObject({rounds:{0:{done:false,mistake:false}}});
  await page.locator('.studio-next').tap();expect(await page.locator('.studio-objective').textContent()).not.toBe(goal);
  await solve(page,'measure-pour',buildStudioRound('measure-pour',10,1));
});

test('beat maker saves separate age patterns, restores reloads, and stays playable offline',async({page,context})=>{
  await start(page,'beat-maker',10);await expect(page.locator('.studio-check')).toBeHidden();
  await page.locator('[data-track="0"][data-beat-step="0"]').tap();await page.getByRole('button',{name:'Show steps 13 to 16'}).tap();
  await page.locator('[data-track="3"][data-beat-step="15"]').tap();await page.getByRole('button',{name:'+ Faster',exact:true}).tap();
  await page.reload();await expect(page.locator('[data-track="0"][data-beat-step="0"]')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Show steps 13 to 16'}).tap();await expect(page.locator('[data-track="3"][data-beat-step="15"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.studio-tempo')).toContainText('108');
  await context.setOffline(true);await page.locator('.studio-reset').tap();await expect(page.locator('[data-track="3"][data-beat-step="15"]')).toHaveAttribute('aria-pressed','false');
  await page.locator('.studio-undo').tap();await expect(page.locator('[data-track="3"][data-beat-step="15"]')).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>Object.keys(allProgress().entries))).toEqual([]);
  await context.setOffline(false);await start(page,'beat-maker',2);await expect(page.locator('.studio-beat-cell[aria-pressed="true"]')).toHaveCount(0);await expect(page.locator('.studio-beat-cell')).toHaveCount(8);
});

test('beat maker creates no audio until a gesture and handles unavailable sound without losing work',async({page})=>{
  await page.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined;window.__speechCount=0;window.speechSynthesis={speak(){window.__speechCount++;},cancel(){}};});
  await start(page,'beat-maker',6);await page.locator('[data-track="0"][data-beat-step="0"]').tap();
  await page.locator('.studio-beat-play').tap();await expect(page.locator('.studio-status')).toContainText('Sound could not start');
  await expect(page.locator('[data-track="0"][data-beat-step="0"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.studio-beat-play')).toBeEnabled();expect(await page.evaluate(()=>__speechCount)).toBe(0);
});

test('beat audio is explicitly cancelled on background and controller close, including pending startup',async({page})=>{
  await page.addInitScript(()=>{
    window.__contexts=[];const Native=window.AudioContext||window.webkitAudioContext;
    if(!Native)return;function Observe(){const context=new Native();context.resume=()=>new Promise(()=>{});window.__contexts.push(context);return context;}Observe.prototype=Native.prototype;window.AudioContext=Observe;window.webkitAudioContext=Observe;
  });
  await start(page,'beat-maker',10);expect(await page.evaluate(()=>__contexts.length)).toBe(0);await page.locator('[data-track="0"][data-beat-step="0"]').tap();expect(await page.evaluate(()=>__contexts.length)).toBe(0);
  await page.locator('.studio-beat-play').tap();await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await expect(page.locator('.studio-beat-play')).toBeEnabled();
  await expect.poll(()=>page.evaluate(()=>__contexts.every(context=>context.state==='closed'))).toBe(true);
  await page.locator('.studio-beat-play').tap();await page.evaluate(()=>dispatchEvent(new Event('doodle-native-inactive')));await expect(page.locator('.studio-beat-play')).toBeEnabled();
  await expect.poll(()=>page.evaluate(()=>__contexts.every(context=>context.state==='closed'))).toBe(true);
  await page.locator('.studio-beat-play').tap();await page.evaluate(()=>controller.close());await expect(page.locator('.studio-screen')).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>__contexts.every(context=>context.state==='closed'))).toBe(true);
});
