import {test,expect} from '@playwright/test';
import {getLearningItems,STROKES} from '../learning-data.js';
const board=page=>page.getByTestId('trace-board');
async function start(page,age=10){await page.setViewportSize({width:375,height:812});await page.addInitScript(age=>localStorage.setItem('doodle-fun:v2:settings',JSON.stringify({age,level:'auto'})),age);await page.goto('/#word-tracing');await expect(board(page)).toBeVisible();}
async function tracePaths(page,paths){await board(page).scrollIntoViewIfNeeded();for(const path of paths){const points=await board(page).evaluate((svg,path)=>path.map(([x,y])=>{const p=svg.createSVGPoint();p.x=x*1000;p.y=y*1000;const screen=p.matrixTransform(svg.getScreenCTM());return [screen.x,screen.y];}),path);await page.mouse.move(...points[0]);await page.mouse.down();for(const point of points.slice(1))await page.mouse.move(...point,{steps:3});await page.mouse.up();}}

for(const age of [6,10])test(`age ${age}: every word completes through enlarged letters with whole-word ink preserved`,async({page})=>{
  test.setTimeout(120000);await start(page,age);
  for(const item of getLearningItems('words',age)){
    await page.locator(`[data-learn-item="${item.ch}"]`).click();await expect(board(page)).toHaveAttribute('data-focus-letter','0');
    const initial=await board(page).getAttribute('viewBox');expect(initial).not.toBe('0 0 1000 1000');let offset=0;
    for(const [i,ch] of [...item.ch].entries()){
      if(i)await page.getByRole('button',{name:'Next letter',exact:true}).click();
      await expect(board(page)).toHaveAttribute('data-focus-letter',String(i));const count=STROKES[ch].length;
      await tracePaths(page,item.strokes.slice(offset,offset+count));offset+=count;
      if(i<item.ch.length-1)await expect(page.locator('.learn-feedback')).not.toHaveClass(/is-complete/);
    }
    await expect(page.locator('.learn-feedback')).toHaveClass(/is-complete/);
    const ink=await page.locator('.learn-ink-layer').innerHTML();await page.getByRole('button',{name:'Whole word',exact:true}).click();await expect(board(page)).toHaveAttribute('viewBox','0 0 1000 1000');await expect(page.locator('.learn-ink-layer')).toHaveJSProperty('innerHTML',ink);
  }
});

test('letter focus survives rotation and rejects taps, missing letters, and off-guide scribbles',async({page})=>{
  await start(page);const item=getLearningItems('words',10)[0],count=STROKES[item.ch[0]].length;
  const b=await board(page).boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);await page.getByRole('button',{name:'Check tracing',exact:true}).click();await expect(page.locator('.learn-feedback')).not.toHaveClass(/is-complete/);
  await page.getByRole('button',{name:'↺ Start again',exact:true}).click();await tracePaths(page,item.strokes.slice(0,count));const ink=await page.locator('.learn-ink-layer').innerHTML(),view=await board(page).getAttribute('viewBox');
  await page.setViewportSize({width:812,height:375});await expect(board(page)).toHaveAttribute('viewBox',view);await expect(page.locator('.learn-ink-layer')).toHaveJSProperty('innerHTML',ink);
  await page.getByRole('button',{name:'Next letter',exact:true}).click();await page.getByRole('button',{name:'Previous letter',exact:true}).click();await expect(page.locator('.learn-ink-layer')).toHaveJSProperty('innerHTML',ink);
  await page.getByRole('button',{name:'Check tracing',exact:true}).click();await expect(page.locator('.learn-feedback')).not.toHaveClass(/is-complete/);
  await page.getByRole('button',{name:'↺ Start again',exact:true}).click();await board(page).scrollIntoViewIfNeeded();const r=await board(page).boundingBox();await page.mouse.move(r.x+8,r.y+8);await page.mouse.down();await page.mouse.move(r.x+r.width-8,r.y+r.height-8,{steps:15});await page.mouse.up();await page.getByRole('button',{name:'Check tracing',exact:true}).click();await expect(page.locator('.learn-feedback')).not.toHaveClass(/is-complete/);
});

// Change the settings control without leaving the mounted exercise: returning
// through Home intentionally starts a new round and would not test revocation.
async function hintPolicy(page,value){await page.locator('#hint-policy').selectOption(value,{force:true});await expect(page.locator('body')).toHaveAttribute('data-help-policy',value);}
test('revoking a tracing hint removes its model while preserving ink and mistake history',async({page})=>{
  await start(page);await page.emulateMedia({reducedMotion:'reduce'});
  const item=getLearningItems('words',10)[0];await tracePaths(page,item.strokes.slice(0,1));
  await page.getByRole('button',{name:'Check tracing',exact:true}).click();const ink=await page.locator('.learn-ink-layer').innerHTML();
  await page.getByRole('button',{name:'▶ Show me',exact:true}).click();await expect(page.locator('.learn-demo-layer path')).not.toHaveCount(0);
  const medalsBefore=await page.evaluate(()=>localStorage.getItem('doodle-fun:v2:medal-progress-v1'));
  await hintPolicy(page,'off');await expect(page.locator('.learn-demo-layer')).toBeEmpty();await expect(page.locator('.learn-ink-layer')).toHaveJSProperty('innerHTML',ink);
  expect(await page.evaluate(()=>localStorage.getItem('doodle-fun:v2:medal-progress-v1'))).toBe(medalsBefore);await expect(page.locator('.learn-feedback')).not.toHaveClass(/is-complete/);
});
test('revoking counting hints removes model counts but keeps the child’s counted dots',async({page})=>{
  await start(page,5);await page.goto('/#counting');const dots=page.locator('.learn-count-dot');await dots.last().click();await expect(dots.last()).toHaveText('1');
  await page.getByRole('button',{name:'Show counting steps',exact:true}).click();await expect(page.locator('.learn-count-dot.is-counted')).toHaveCount(await dots.count());
  await hintPolicy(page,'off');await expect(page.locator('.learn-count-dot.is-counted')).toHaveCount(1);await expect(dots.last()).toHaveText('1');await expect(page.locator('.learn-feedback')).not.toHaveClass(/is-complete/);
});
